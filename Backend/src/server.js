import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { getDefaultStudent, pool } from "./db.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: true }));
app.use(express.json());

function mapCourse(row) {
  return {
    id: row.class_code,
    classId: row.class_id,
    major: row.major_name,
    title: row.class_name,
    desc: row.class_desc,
    seatsLeft: Math.max(row.seats - row.registered_count, 0),
    seatsTotal: row.seats,
    registeredCount: row.registered_count,
    category: row.category,
    credits: row.credits,
    instructor: row.instructor,
    isRegistered: Boolean(row.is_registered),
  };
}

async function selectCourses(studentId) {
  const [rows] = await pool.query(
    `SELECT c.class_id, c.class_code, c.class_name, c.class_desc, c.seats, c.credits,
            c.category, c.instructor, m.major_name,
            COUNT(sc_all.id) AS registered_count,
            MAX(CASE WHEN sc_me.stu_id IS NULL THEN 0 ELSE 1 END) AS is_registered
       FROM classes c
       JOIN majors m ON m.major_id = c.major_id
       LEFT JOIN stu_classes sc_all ON sc_all.class_id = c.class_id
       LEFT JOIN stu_classes sc_me ON sc_me.class_id = c.class_id AND sc_me.stu_id = :studentId
      GROUP BY c.class_id, c.class_code, c.class_name, c.class_desc, c.seats, c.credits,
               c.category, c.instructor, m.major_name
      ORDER BY c.class_id`,
    { studentId },
  );

  return rows.map(mapCourse);
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (error) {
    res.status(503).json({ ok: false, db: "unavailable", message: error.message });
  }
});

app.get("/api/student", async (_req, res, next) => {
  try {
    const student = await getDefaultStudent();
    if (!student) {
      res.status(404).json({ message: "Default student not found" });
      return;
    }
    res.json(student);
  } catch (error) {
    next(error);
  }
});

app.get("/api/courses", async (_req, res, next) => {
  try {
    const student = await getDefaultStudent();
    if (!student) {
      res.status(404).json({ message: "Default student not found" });
      return;
    }
    res.json(await selectCourses(student.stu_id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/registrations", async (_req, res, next) => {
  try {
    const student = await getDefaultStudent();
    if (!student) {
      res.status(404).json({ message: "Default student not found" });
      return;
    }
    const courses = await selectCourses(student.stu_id);
    res.json(courses.filter((course) => course.isRegistered));
  } catch (error) {
    next(error);
  }
});

app.post("/api/registrations", async (req, res, next) => {
  const { classId } = req.body;
  if (!classId) {
    res.status(400).json({ message: "classId is required" });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const student = await getDefaultStudent();
    if (!student) {
      res.status(404).json({ message: "Default student not found" });
      return;
    }

    const [[course]] = await connection.query(
      `SELECT c.class_id, c.seats, c.credits
         FROM classes c
        WHERE c.class_id = :classId
        FOR UPDATE`,
      { classId },
    );

    if (!course) {
      await connection.rollback();
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const [[capacity]] = await connection.query(
      "SELECT COUNT(id) AS registered_count FROM stu_classes WHERE class_id = :classId",
      { classId },
    );

    if (capacity.registered_count >= course.seats) {
      await connection.rollback();
      res.status(409).json({ message: "이미 마감된 강의입니다." });
      return;
    }

    const [[limits]] = await connection.query(
      `SELECT COUNT(sc.id) AS class_count, COALESCE(SUM(c.credits), 0) AS credit_count
         FROM stu_classes sc
         JOIN classes c ON c.class_id = sc.class_id
        WHERE sc.stu_id = :studentId`,
      { studentId: student.stu_id },
    );

    if (limits.class_count >= student.max_classes) {
      await connection.rollback();
      res.status(409).json({ message: `최대 신청 가능 과목 수(${student.max_classes}개)를 초과합니다.` });
      return;
    }

    if (limits.credit_count + course.credits > student.max_credits) {
      await connection.rollback();
      res.status(409).json({ message: `최대 신청 가능 학점(${student.max_credits}학점)을 초과합니다.` });
      return;
    }

    await connection.query(
      "INSERT INTO stu_classes (stu_id, class_id) VALUES (:studentId, :classId)",
      { studentId: student.stu_id, classId },
    );
    await connection.commit();
    res.status(201).json({ message: "수강신청이 완료되었습니다." });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ message: "이미 신청한 강의입니다." });
      return;
    }
    next(error);
  } finally {
    connection.release();
  }
});

app.delete("/api/registrations/:classId", async (req, res, next) => {
  try {
    const student = await getDefaultStudent();
    if (!student) {
      res.status(404).json({ message: "Default student not found" });
      return;
    }
    await pool.query(
      "DELETE FROM stu_classes WHERE stu_id = :studentId AND class_id = :classId",
      { studentId: student.stu_id, classId: req.params.classId },
    );
    res.json({ message: "수강신청이 취소되었습니다." });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Server error", detail: error.message });
});

app.listen(port, () => {
  console.log(`Dragon University API listening on http://127.0.0.1:${port}`);
});

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "dragon_app",
  password: process.env.DB_PASSWORD ?? "dragonpass",
  database: process.env.DB_NAME ?? "dragon_university",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

export async function getDefaultStudent(connection = pool) {
  const studentNumber = process.env.STUDENT_NUMBER ?? "20251119";
  const [rows] = await pool.query(
    `SELECT s.stu_id, s.stu_name, s.stu_num, s.email, s.max_classes, s.max_credits,
            m.major_name
       FROM students s
       JOIN majors m ON m.major_id = s.major_id
      WHERE s.stu_num = :studentNumber
      LIMIT 1`,
    { studentNumber },
  );

  return rows[0];
}

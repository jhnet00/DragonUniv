# rb k3s MariaDB 구축 메모

작성일: 2026년 6월 9일

## 현재 상태 정리

현재 repo에는 MariaDB 스키마와 seed SQL 파일이 있다.

```txt
database/init/001_schema.sql
database/init/002_seed.sql
```

VM에 repo를 clone한 상태라면 파일은 VM 안에 존재하지만, 이것만으로 DB가 실행되는 것은 아니다.

DB가 실제로 구축되었다고 말하려면 k3s 안에 MariaDB Pod, Service, PVC가 생성되고 초기 SQL이 적용되어야 한다.

## 적용 파일

MariaDB k3s 리소스:

```txt
k8s/mariadb.yaml
```

포함 리소스:

- Namespace: `dragon-univ`
- Secret: `mariadb-secret`
- ConfigMap: `mariadb-config`
- ConfigMap: `mariadb-initdb`
- Service: `mariadb`
- StatefulSet: `mariadb`
- PVC: `mariadb-data-mariadb-0`

## VM에서 적용

repo 최신화:

```bash
cd /home/ruby/dragon-univ-fresh
git pull origin develop
```

MariaDB 배포:

```bash
sudo kubectl apply -f k8s/mariadb.yaml
```

상태 확인:

```bash
sudo kubectl get pods -n dragon-univ
sudo kubectl get svc -n dragon-univ
sudo kubectl get pvc -n dragon-univ
```

MariaDB Pod가 `Running`이고 READY가 `1/1`이면 기본 실행은 성공이다.

## DB 초기 데이터 확인

Pod 이름 확인:

```bash
sudo kubectl get pods -n dragon-univ
```

SQL 확인:

```bash
sudo kubectl exec -n dragon-univ -it mariadb-0 -- \
  mariadb -u dragon_app -pdragonpass dragon_university \
  -e "SELECT class_id, class_code, class_name, seats FROM classes;"
```

학생 데이터 확인:

```bash
sudo kubectl exec -n dragon-univ -it mariadb-0 -- \
  mariadb -u dragon_app -pdragonpass dragon_university \
  -e "SELECT stu_id, stu_name, stu_num, max_classes, max_credits FROM students;"
```

## Backend manifest에서 사용할 DB env

jh가 Backend Deployment manifest를 작성할 때 아래 값을 사용한다.

```txt
PORT=4000
DB_HOST=mariadb
DB_PORT=3306
DB_USER=dragon_app
DB_PASSWORD=dragonpass
DB_NAME=dragon_university
STUDENT_NUMBER=20251119
```

Backend Deployment가 `dragon-univ` namespace 안에 있으면 `DB_HOST=mariadb`만으로 연결된다.

다른 namespace에서 Backend를 띄우는 경우에는 아래처럼 전체 DNS 이름을 사용한다.

```txt
DB_HOST=mariadb.dragon-univ.svc.cluster.local
```

## 다시 초기화해야 할 때

초기 SQL은 MariaDB data directory가 비어 있을 때만 자동 실행된다.

DB를 완전히 초기화하려면 StatefulSet과 PVC를 삭제한 뒤 다시 apply한다.

주의: 아래 명령은 DB 데이터를 삭제한다.

```bash
sudo kubectl delete -f k8s/mariadb.yaml
sudo kubectl delete pvc mariadb-data-mariadb-0 -n dragon-univ
sudo kubectl apply -f k8s/mariadb.yaml
```

## Docker Hub 전달 방식

각자 VM이 따로 있으면 tar 파일 전달보다 Docker Hub를 쓰는 방식이 더 실무적이다.

rb가 이미지 push:

```bash
docker tag dragon-frontend:latest <dockerhub-id>/dragon-frontend:latest
docker tag dragon-backend:latest <dockerhub-id>/dragon-backend:latest
docker push <dockerhub-id>/dragon-frontend:latest
docker push <dockerhub-id>/dragon-backend:latest
```

jh는 manifest에서:

```yaml
image: <dockerhub-id>/dragon-frontend:latest
image: <dockerhub-id>/dragon-backend:latest
imagePullPolicy: Always
```

로 사용하면 된다.

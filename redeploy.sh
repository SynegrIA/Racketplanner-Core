set -e

cd "$(dirname "$0")"


#BACKEND
echo 'Vamos a reconstruir el backend...'

docker build --platform Linux/amd64 -t xesuspb/picketballplanner-backend:latest --push Backend

echo 'Ahora vamos a redesplegar el backend'

kubectl delete deployment picketball-racketplanner-backend
kubectl apply -f k8s/backend/deployment.yaml

echo 'Backend reconstruido y redesplegado correctamente'


#FRONTEND
echo 'Vamos a reconstruir el frontend...'

docker build --platform Linux/amd64 -t xesuspb/picketballplanner-frontend:latest --push Frontend

echo 'Ahora vamos a redesplegar el frontend'

kubectl delete deployment picketball-racketplanner-frontend
kubectl apply -f k8s/frontend/deployment.yaml

echo 'Frontend reconstruido y redesplegado correctamente'
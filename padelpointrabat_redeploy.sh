set -e

cd "$(dirname "$0")"


#BACKEND
echo 'Vamos a reconstruir el backend...'

docker build --platform Linux/amd64 -t xesuspb/padelpointrabat-racketplanner-backend:latest --push Backend

echo 'Ahora vamos a redesplegar el backend'

kubectl rollout restart deployment padelpointrabat-racketplanner-backend

echo 'Backend reconstruido y redesplegado correctamente'


#FRONTEND
echo 'Vamos a reconstruir el frontend...'

docker build --platform Linux/amd64 -t xesuspb/padelpointrabat-racketplanner-frontend:latest --push Frontend

echo 'Ahora vamos a redesplegar el frontend'

kubectl rollout restart deployment padelpointrabat-racketplanner-frontend

echo 'Frontend reconstruido y redesplegado correctamente'
set -e #Esta config detiene la ejecución del script si algo falla

cd "$(dirname "$0")"

echo 'Vamos a redesplegar el frontend...'

kubectl delete deployment picketball-racketplanner-frontend

kubectl apply -f deployment.yaml

echo 'Frontend redesplegado correctamente'
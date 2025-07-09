set -e #Esta config detiene la ejecución del script si algo falla

cd "$(dirname "$0")"

echo 'Vamos a redesplegar el backend...'

kubectl delete deployment picketball-racketplanner-backend

kubectl apply -f deployment.yaml

echo 'Backend redesplegado correctamente'
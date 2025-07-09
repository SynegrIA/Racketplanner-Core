set -e #Esta config detiene la ejecución del script si algo falla

cd "$(dirname "$0")"

echo 'Vamos a construir la imagen del Frontend...'

docker build --platform Linux/amd64 -t xesuspb/picketballplanner-frontend:latest --push ./

echo 'Imagen construida correctamente'
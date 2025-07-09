set -e #Esta config detiene la ejecución del script si algo falla

cd "$(dirname "$0")"

echo 'Vamos a construir la imagen del Backend...'

docker build --platform Linux/amd64 -t xesuspb/picketballplanner-backend:latest --push ./

echo 'Imagen construida correctamente'
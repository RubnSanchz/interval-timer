# Guia para generar e instalar el APK (Android)

## Requisitos
- Cuenta de Expo (EAS). Crear en: https://expo.dev/signup
- Node.js instalado.
- Proyecto en este repo.

## Login en EAS
```bash
npx eas-cli@16.32.0 login
```

## Generar APK instalable
```bash
npx eas-cli@16.32.0 build -p android --profile apk
```

Cuando termine, EAS muestra una URL para descargar el APK.

## Instalar en el telefono
1) Descarga el APK en el telefono (desde la URL de EAS) o copialo por USB/Drive/Correo.
2) Habilita "Instalar apps desconocidas" para la app con la que abriste el APK
   (navegador o gestor de archivos).
3) Abre el APK y confirma la instalacion.
4) Opcional: desactiva "Instalar apps desconocidas" al terminar.

## Play Store (AAB)
Para publicar, genera un AAB:
```bash
npx eas-cli@16.32.0 build -p android --profile production
```

## Notas
- El applicationId actual es `com.rubnsanchz.intervaltimer`.
- La version visible es `1.0.0` y el versionCode es `1`.

# Interval Timer (Android)

Aplicación Android de temporizador por intervalos para entrenamiento. Permite configurar ciclos de **ejercicio** y **descanso** repetidos por **sets**, mostrar una **cuenta atrás** en pantalla, reproducir **sonidos distintos** al finalizar cada fase (ejercicio/descanso) y guardar **presets** reutilizables.

> Objetivo: construirlo paso a paso, priorizando una primera versión funcional (MVP) y luego mejorar UX, persistencia y audio.

---

## Inicio rápido

```bash
npm install
npm run start
```

Atajos útiles:
- `npm run android`
- `npm run ios`
- `npm run web`

---

## Estado actual

- Configuración básica de intervalos + ejecución del temporizador.
- Presets en memoria (persistencia pendiente).

---

## Funcionalidades

### MVP (Primera versión)

- Configuración de temporizador:
  - Tiempo de ejercicio (segundos)
  - Tiempo de descanso (segundos)
  - Número de sets
- Pantalla de ejecución:
  - Cuenta atrás visible
  - Indicador de fase (Ejercicio / Descanso)
  - Set actual / sets totales
  - Botones: Iniciar / Pausar / Reanudar / Reiniciar
- Sonidos:
  - Sonido A al terminar ejercicio (inicio descanso)
  - Sonido B al terminar descanso (inicio ejercicio o fin total)

### Fase 2 (Después del MVP)

- Presets:
  - Guardar preset (nombre + configuración)
  - Listar presets
  - Cargar / editar / borrar presets
- Mejoras de UX:
  - Vibración opcional
  - Pantalla siempre activa durante el temporizador
  - Contador “3, 2, 1” antes de empezar (opcional)

### Fase 3 (Opcional)

- Historial de entrenos
- Personalización de sonidos
- Notificaciones/controles en segundo plano

---

## Stack actual

- React Native + Expo (Expo Router)
- Persistencia: AsyncStorage (presets, pendiente)
- Audio: expo-av (sonidos, pendiente)

---

## Estructura actual

```text
/app              // navegación/pantallas (Expo Router)
/components       // componentes UI reutilizables
/constants        // tema, constantes
/hooks            // hooks de UI
/domain
  /models         // tipos/entidades del dominio (Preset, TimerState...)
  /validators     // validaciones del dominio
  /presets        // creación de presets
/services         // persistencia, timer, etc.
/utils            // helpers genéricos (formateo, ids, etc.)
/assets
  /sounds         // sonidos
/scripts          // scripts de soporte (Expo)
```

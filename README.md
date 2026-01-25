# Interval Timer (Android)

Aplicación Android de temporizador por intervalos para entrenamiento. Permite configurar ciclos de **ejercicio** y **descanso** repetidos por **sets**, mostrar una **cuenta atrás** en pantalla, reproducir **sonidos distintos** al finalizar cada fase (ejercicio/descanso) y guardar **presets** reutilizables.

> Objetivo: construirlo paso a paso, priorizando una primera versión funcional (MVP) y luego mejorar UX, persistencia y audio.

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

## Stack propuesto

**Opción recomendada (por experiencia previa en JS):**

- React Native + Expo
- Persistencia: AsyncStorage (presets)
- Audio: expo-av (sonidos)

> Valorar Android nativo (Kotlin + Jetpack Compose)

---

## Estructura inicial (tentativa)

```text
/src
  /app            // navegación/pantallas (si usa Expo Router) o "screens"
  /screens        // si NO uso Expo Router, aquí van las pantallas
  /components     // componentes UI reutilizables (botones, inputs, etc.)
  /domain
    /models       // tipos/entidades del dominio (Preset, TimerState...)
    /validators   // validaciones del dominio
  /services
    storage.ts    // persistencia (AsyncStorage)
    timer.ts      // lógica del temporizador
  /utils          // helpers genéricos (formateo mm:ss, etc.)
/assets
  /sounds         // sonidos


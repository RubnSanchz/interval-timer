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

> Si se prefiere Android nativo (Kotlin + Jetpack Compose), se puede replantear el stack.

---

## Estructura inicial (tentativa)

/src
/components
TimerDisplay.tsx
PresetList.tsx
/screens
SetupScreen.tsx
TimerScreen.tsx
PresetsScreen.tsx
/services
timerEngine.ts
presetsStorage.ts
sound.ts
/models
Preset.ts
App.tsx
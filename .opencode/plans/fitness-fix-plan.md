# Plan: Fitness Coach - Fix reported issues

Issues from "Fitness Coach fallos para arreglar.docx" (prioritized):

## Críticos
1. **Workout.js line ~239**: `setRest(null)` but `rest` state doesn't exist. Causes crash after saving session. Fix: remove that line.
2. **Android back closes app**: App.js doesn't handle BackHandler; in Workout overlay accidental back exits app. Need to intercept BackHandler - if Workout overlay open (routine non-null), prevent default / close overlay or prompt.
3. **Session lost if app closes**: Session only in React state. Need to save draft to AsyncStorage after each set (or on key changes) and offer "Continue workout" on app start. Also need UI flow - maybe store draft under KEY + ':draft' and clear on finish/cancel.
4. **"Salir" discards everything**: When progress exists, "Salir" says "no se guardará" (just discards). Offer "Guardar lo hecho" - i.e. save partial session like finishSession does for completed sets (already filters exercises with sets done). Current askClose already warns; maybe change copy/action to allow saving partial? Or add option "Guardar y salir".
5. **Corrupted data loss**: In store.js, JSON.parse failure falls back to seed silently and next save overwrites. Need backup before overwrite, warn user. Can keep last good copy in AsyncStorage under backup key, or recover from backup on parse failure.

## Importantes
6. **Rest miscalculated when skipping sets**: restBeforeSec uses previous set's endedAt; if endedAt null (skipped), becomes 0. Use last valid endedAt or null.
7. **Ring recreated every 250ms**: Ring component defined inside Workout component - recreated each render; timer causes re-renders every 250ms. Move Ring outside component or memoize.
8. **Pre-filled reps/RIR treated as confirmed**: Reps/RIR pre-filled with targets; if user just taps Save, treated as real data. Mark as unconfirmed or require explicit change/touch.
9. **Units in lb rounding/steps**: Step is 5 lb but conversions from kg (2.5kg=5.5lb) cause odd values; decimals can break PR comparison. Round to "real plate" values per unit and store rounded weight.
10. **Inconsistent typography**: H and Btn don't set fontFamily Inter; system font. Add fontFamily.
11. **Tabs remount on change**: key={tab} in App.js causes remount/loss of state/animations. Remove key or keep mounted.
12. **Small touch targets**: Close chevron ~34px, +/- 44px. Need min 48px hitSlop.

Let us read ui.js, Home/Routines etc to understand patterns.

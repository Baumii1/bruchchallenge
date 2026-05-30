# Bruch Challenge: Pulse + Streak Setup

## Pulsoid ohne BRO

Wenn Pulsoid beim OAuth-Fenster `BRO plan is required for this action` zeigt, ist die direkte Account-/API-Verknüpfung nicht kostenlos verfügbar. Das sollte nicht umgangen werden. Kostenlos bleiben praktisch drei Wege:

1. Pulsoid-Widget direkt als eigene OBS-Browser-Source nutzen.
2. `/admin/pulse-control` als manuellen Fallback nutzen.
3. Eine andere Quelle nutzen, die BPM als lokales JSON/WebSocket/HTTP bereitstellt, und diese Werte in `writePulseBroadcastEntry` schreiben.

Für das neue eigene Overlay wird kein Pulsoid-OAuth benötigt. Es liest aus dem bestehenden Pulse-Broadcast.

## Empfohlene Pulse-Konfiguration

In `.env.local`:

```env
NEXT_PUBLIC_PULSE_PLAYERS=[{"id":"merlin","name":"Merlin","provider":"broadcast"},{"id":"patrick","name":"Patrick","provider":"broadcast"}]
```

Wenn keine Env gesetzt ist, verwendet `src/lib/pulse.ts` jetzt automatisch Merlin und Patrick als Broadcast-Player.

## Neue Seiten

- `/obs/pulse`  
  OBS-Overlay für zwei Pulswerte nebeneinander. Browser Source: ca. 560 x 118 px.

- `/admin/pulse-control`  
  Manuelle Eingabe/Broadcast für Merlin und Patrick.

- `/admin/live-results`  
  Live-Result-Recorder für Win/Loss/Draw.  
  `Win` erhöht die Win-Streak, `Loss` setzt sie zurück, `Draw` bleibt neutral. b2b/b3b wird automatisch aus Name/Objective erkannt oder über `requiredWinStreak` im Editor gesetzt.

## Past Games bearbeiten

Im bestehenden Challenge-Editor sind jetzt zusätzlich bearbeitbar:

- Wins
- Losses
- Draws
- required/current/best Win-Streak
- Versuche/Notizen als multiline Textfeld

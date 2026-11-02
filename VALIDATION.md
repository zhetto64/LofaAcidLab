# Synth panel validation — 2026-11-02

Tested in the Codex in-app browser against the local HTML:

- Classic / AFX × steps 1–32 × bars 1, 2, 4, 8: all 256 combinations produce the expected sequence length and MIDI note range 24–84.
- Keyboard Home / End and pointer drag update the cutoff value, indicator, output and ARIA value. An 80px upward drag changed cutoff from 100 to 2300 Hz.
- Test sound initializes/resumes Web Audio; Play enters PLAYING and Stop returns STOPPED. SAW / SQUARE selection works.
- Instrumented scheduler: 15-note bass wraps at step 15 while drum indices continue through 15 and wrap at 16; disabling drums suppresses drum scheduling.
- 390px viewport: document scroll width equals viewport width. Step editor retains its existing internal horizontal scroll.
- MIDI binary parsed for a deterministic 3-step fixture: Type 0, one track, PPQ 480, notes C2/G2 at ticks 0/120, velocities 120/85, note-offs at 120/214, final rest preserved with end-of-track tick 360, eight slide bend events plus two center resets. Header length is now the required six bytes.
- JavaScript syntax and git whitespace checks pass.

Still requires physical-device verification: iPhone Safari sound/touch behavior and hardware MIDI bend-range/slide compatibility. No TB-303 reference image was attached to this chat; styling follows the written brief.

## Full instrument enclosure and keyboard — 2026-11-02

- Replaced the dark page with a unified silver enclosure, black panel printing, restrained red indicators and hardware-style buttons.
- Replaced per-step pitch dropdowns with a 13-key chromatic keyboard, selected-step note display, octave transpose and Accent/Slide/Rest buttons. Pitch entry auditions a note only while playback is stopped; rests stay rests until explicitly toggled.
- Sixteen-step banks cover every step up to the existing 256-step maximum. Verified first/last bank boundaries, selection after shrinking a pattern, octave boundaries at MIDI 24/84, mode switching and independent flag editing.
- Clicked a black key and verified D#2 in the note display, selected the second bank, and checked Play/Stop.
- At 390px, the keyboard, eight-column step rows and editing controls fit without document horizontal overflow.
- Generator, MIDI encoding and drum scheduling algorithms are unchanged by this redesign. The prior binary MIDI and polymeter checks still apply.
- Physical iPhone Safari touch/audio verification remains outstanding.

## Compact controller layout — 2026-11-02

- Desktop generator and synthesizer now share a two-column row above the sequencer/keyboard. Knob diameter is 50px (previously 64px), with a 72px scale ring. Reduced panel spacing and step heights; preserved the keyboard styling and all controls.
- Instructions moved to native details/summary; no musical controller is hidden. Mobile keeps a stacked layout with four synth knobs per row.
- Browser measurements at the supplied screenshot size, 1269×998: every visible controller fits inside the viewport; no horizontal or vertical document overflow. At 1280×720, keyboard bottom is at y=672 and all musical controllers fit; help/footer may scroll.
- Checked 320px and 390px widths without horizontal overflow; clicked keyboard pitch and Accent, switched banks, changed cutoff with a keyboard arrow, and verified Play/Stop. Browser error log empty.
- Audio, sequencer and MIDI JavaScript unchanged.

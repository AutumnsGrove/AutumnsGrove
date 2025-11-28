# Ambient Sounds

Add your own ambient audio files to this directory for the Grove Writer editor.

## Required Files

The editor looks for these audio files:

- `forest-ambience.mp3` - Birds chirping, wind through trees
- `rain-ambience.mp3` - Gentle rainfall on leaves
- `campfire-ambience.mp3` - Crackling fire, warm embers
- `night-ambience.mp3` - Crickets, gentle breeze
- `cafe-ambience.mp3` - Soft murmurs, clinking cups

## Recommendations

- Use **loopable** audio files (seamless start/end transitions)
- Keep files under **5MB** each for reasonable load times
- MP3 format recommended for broad browser support
- Aim for **30-60 second** loops minimum

## Free Sound Sources

- [Freesound.org](https://freesound.org) - CC0 and Creative Commons sounds
- [Zapsplat](https://www.zapsplat.com) - Free sound effects
- [Mixkit](https://mixkit.co/free-sound-effects/) - Free ambient sounds
- [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/) - Personal/educational use

## Usage

1. Download ambient sounds from the sources above
2. Rename files to match the expected names
3. Place in this `/static/sounds/` directory
4. The editor will automatically detect and play them

If a sound file is missing, the editor will gracefully show a console warning.

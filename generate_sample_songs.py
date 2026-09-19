import wave
import math
import struct
import os

# Create both public/songs and root songs directories
os.makedirs("public/songs", exist_ok=True)
os.makedirs("songs", exist_ok=True)

# Generate 12 pleasing melodic audio tracks (.wav formatted as .mp3 compatible or audio file)
# 44100Hz, 16-bit PCM mono, ~15 seconds each
sample_rate = 44100
duration = 15.0 # seconds
num_samples = int(sample_rate * duration)

melodies = [
    [261.63, 329.63, 392.00, 523.25], # C - E - G - C
    [293.66, 369.99, 440.00, 587.33], # D - F# - A - D
    [329.63, 392.00, 493.88, 659.25], # E - G - B - E
    [349.23, 440.00, 523.25, 698.46], # F - A - C - F
    [392.00, 493.88, 587.33, 783.99], # G - B - D - G
    [440.00, 554.37, 659.25, 880.00], # A - C# - E - A
    [493.88, 587.33, 739.99, 987.77], # B - D - F# - B
    [523.25, 659.25, 783.99, 1046.50],# C5
    [392.00, 329.63, 261.63, 392.00], # G - E - C - G
    [440.00, 392.00, 349.23, 329.63], # A - G - F - E
    [329.63, 349.23, 392.00, 523.25], # E - F - G - C
    [261.63, 392.00, 523.25, 659.25]  # C - G - C - E
]

for song_idx in range(1, 13):
    scale = melodies[(song_idx - 1) % len(melodies)]
    filename_wav_public = f"public/songs/{song_idx}.mp3"
    filename_wav_root = f"songs/{song_idx}.mp3"
    
    for fname in [filename_wav_public, filename_wav_root]:
        with wave.open(fname, 'w') as wav_file:
            wav_file.setnchannels(1) # mono
            wav_file.setsampwidth(2) # 16-bit
            wav_file.setframerate(sample_rate)
            
            note_len = 0.5 # 0.5s per note
            samples = bytearray()
            for i in range(num_samples):
                t = i / sample_rate
                note_i = int(t / note_len) % len(scale)
                freq = scale[note_i]
                
                # Envelope: slight attack and decay per note
                pos_in_note = (t % note_len) / note_len
                envelope = math.sin(pos_in_note * math.pi)
                
                # Harmonics for pleasing acoustic bell sound
                sample_val = (
                    0.6 * math.sin(2 * math.pi * freq * t) +
                    0.25 * math.sin(2 * math.pi * freq * 2 * t) +
                    0.15 * math.sin(2 * math.pi * freq * 3 * t)
                ) * envelope * 0.5
                
                val = int(sample_val * 32767)
                val = max(-32768, min(32767, val))
                samples.extend(struct.pack('<h', val))
            
            wav_file.writeframes(samples)

print("Generated 12 sample audio tracks in public/songs and songs/!")

import asyncio
import sys
import edge_tts

SUPPORTED_VOICES = {
    "th-TH-PremwadeeNeural": "th-TH-PremwadeeNeural",
    "th-TH-NiwatNeural": "th-TH-NiwatNeural",
    # Fallback mappings for deprecated or requested voices
    "th-TH-AcharaNeural": "th-TH-PremwadeeNeural",
    "th-TH-PremwadeeNeural-cute": "th-TH-PremwadeeNeural",
}

async def main():
    if len(sys.argv) < 2:
        sys.exit(1)
    text = sys.argv[1]
    requested_voice = sys.argv[2] if len(sys.argv) > 2 else "th-TH-PremwadeeNeural"
    rate = sys.argv[3] if len(sys.argv) > 3 else "+0%"
    pitch = sys.argv[4] if len(sys.argv) > 4 else "+0Hz"

    # Resolve safe voice
    voice = SUPPORTED_VOICES.get(requested_voice, "th-TH-PremwadeeNeural")

    # If cute variant was picked, bump pitch if default pitch was passed
    if requested_voice == "th-TH-PremwadeeNeural-cute" and pitch == "+0Hz":
        pitch = "+18Hz"
        if rate == "+0%":
            rate = "+5%"
    
    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                sys.stdout.buffer.write(chunk["data"])
    except Exception as e:
        sys.stderr.write(f"TTS generation error: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())


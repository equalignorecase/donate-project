from gtts import gTTS

tts = gTTS(
    text="ขอบคุณที่โดเนทมานะคะ",
    lang="th",
    slow=False
)

tts.save("female.mp3")
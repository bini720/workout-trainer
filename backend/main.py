import os
import json
import base64
import io
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic
from PIL import Image

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


class UserProfile(BaseModel):
    weight: str
    weightUnit: str
    height: str
    bodyType: str
    goal: str
    level: str
    equipment: list[str]
    days: int


def strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return text


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate-workout")
def generate_workout(profile: UserProfile):
    prompt = (
        f"User profile:\n"
        f"- Weight: {profile.weight} {profile.weightUnit}\n"
        f"- Height: {profile.height}\n"
        f"- Body type: {profile.bodyType}\n"
        f"- Goal: {profile.goal}\n"
        f"- Experience level: {profile.level}\n"
        f"- Available equipment: {', '.join(profile.equipment)}\n"
        f"- Training days per week: {profile.days}\n\n"
        f"Generate a single workout session with 6 exercises tailored to this profile."
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            "You are a direct, no-BS personal trainer. Generate a workout plan based on the user profile. "
            "Output ONLY a valid JSON array. Each item must have: "
            "{ exercise, sets, reps, rest_seconds, muscle_group, form_cue, youtube_search }. "
            "form_cue = one short sentence. "
            "youtube_search = exact search string for a demo video. "
            "No extra text, no markdown, no code fences. Just the raw JSON array."
        ),
        messages=[{"role": "user", "content": prompt}],
    )

    raw = strip_code_fences(message.content[0].text)

    try:
        exercises = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON. Try again.")

    return {"exercises": exercises}


@app.post("/detect-equipment")
async def detect_equipment(file: UploadFile = File(...)):
    image_data = await file.read()
    base64_image = base64.b64encode(image_data).decode("utf-8")
    media_type = file.content_type or "image/jpeg"

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": base64_image,
                    },
                },
                {
                    "type": "text",
                    "text": (
                        "List only the fitness equipment visible in this image. "
                        "Be brief. Return a JSON array of strings. No extra text."
                    ),
                },
            ],
        }],
    )

    raw = strip_code_fences(message.content[0].text)

    try:
        equipment = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {repr(raw)}")

    return {"equipment": equipment}


@app.post("/form-feedback")
async def form_feedback(file: UploadFile = File(...), exercise: str = Form(...)):
    image_data = await file.read()

    try:
        image = Image.open(io.BytesIO(image_data))
        img_byte_arr = io.BytesIO()
        image.convert("RGB").save(img_byte_arr, format="JPEG")
        base64_image = base64.b64encode(img_byte_arr.getvalue()).decode("utf-8")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read file. Please upload a JPG or PNG image.")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": base64_image,
                    },
                },
                {
                    "type": "text",
                    "text": (
                        f"The user is attempting {exercise}. "
                        "Analyze their form from this image. "
                        "Give exactly 3 corrections, numbered, direct, and specific. "
                        "No intro sentence."
                    ),
                },
            ],
        }],
    )

    return {"feedback": message.content[0].text.strip()}

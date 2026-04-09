import { useState, useEffect, Component } from 'react'
import './App.css'

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }
  static getDerivedStateFromError() {
    return { crashed: true }
  }
  render() {
    if (this.state.crashed) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. Reload the page to continue.</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ label }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      {label && <span>{label}</span>}
    </div>
  )
}

const EQUIPMENT_OPTIONS = ['Bodyweight', 'Dumbbells', 'Full Gym', 'Resistance Bands']
const BODY_TYPES = ['Ectomorph', 'Mesomorph', 'Endomorph']
const GOALS = ['Build Muscle', 'Lose Weight', 'Gain Weight', 'Improve Endurance']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

// ─── Profile Form ────────────────────────────────────────────────────────────

function ProfileForm({ initial, onSave }) {
  const [weightUnit, setWeightUnit] = useState(initial?.weightUnit || 'lbs')
  const [weight, setWeight] = useState(initial?.weight || '')
  const [height, setHeight] = useState(initial?.height || '')
  const [bodyType, setBodyType] = useState(initial?.bodyType || '')
  const [goal, setGoal] = useState(initial?.goal || '')
  const [level, setLevel] = useState(initial?.level || '')
  const [equipment, setEquipment] = useState(initial?.equipment || [])
  const [days, setDays] = useState(initial?.days || 3)

  function toggleEquipment(item) {
    setEquipment(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!weight || !height || !bodyType || !goal || !level || equipment.length === 0) {
      alert('Please fill out all fields.')
      return
    }
    const profile = { weight, weightUnit, height, bodyType, goal, level, equipment, days }
    localStorage.setItem('userProfile', JSON.stringify(profile))
    onSave(profile)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Your Profile</h1>

      <div className="form-group">
        <label>Weight</label>
        <div className="toggle-row">
          <input
            type="number"
            placeholder={weightUnit === 'lbs' ? 'e.g. 180' : 'e.g. 82'}
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
          <button type="button" className={`toggle-btn ${weightUnit === 'lbs' ? 'active' : ''}`} onClick={() => setWeightUnit('lbs')}>lbs</button>
          <button type="button" className={`toggle-btn ${weightUnit === 'kg' ? 'active' : ''}`} onClick={() => setWeightUnit('kg')}>kg</button>
        </div>
      </div>

      <div className="form-group">
        <label>Height (e.g. 5'11" or 180cm)</label>
        <input type="text" placeholder="e.g. 5'11&quot; or 180cm" value={height} onChange={e => setHeight(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Body Type</label>
        <div className="option-group">
          {BODY_TYPES.map(bt => (
            <button key={bt} type="button" className={`option-btn ${bodyType === bt ? 'selected' : ''}`} onClick={() => setBodyType(bt)}>{bt}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Fitness Goal</label>
        <div className="option-group">
          {GOALS.map(g => (
            <button key={g} type="button" className={`option-btn ${goal === g ? 'selected' : ''}`} onClick={() => setGoal(g)}>{g}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Experience Level</label>
        <div className="option-group">
          {LEVELS.map(l => (
            <button key={l} type="button" className={`option-btn ${level === l ? 'selected' : ''}`} onClick={() => setLevel(l)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Available Equipment (select all that apply)</label>
        <div className="option-group">
          {EQUIPMENT_OPTIONS.map(eq => (
            <button key={eq} type="button" className={`option-btn ${equipment.includes(eq) ? 'selected' : ''}`} onClick={() => toggleEquipment(eq)}>{eq}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Days per week available to train</label>
        <input type="range" min="1" max="7" value={days} onChange={e => setDays(Number(e.target.value))} />
        <div className="slider-value">{days} day{days !== 1 ? 's' : ''}</div>
      </div>

      <button type="submit" className="submit-btn">Save Profile</button>
    </form>
  )
}

// ─── Profile Summary ──────────────────────────────────────────────────────────

function ProfileSummary({ profile, onEdit, onGenerate }) {
  return (
    <div>
      <h1>Your Profile</h1>
      <div className="success-banner">Profile saved successfully!</div>
      <div className="summary-card">
        <div className="summary-row"><span>Weight</span><span>{profile.weight} {profile.weightUnit}</span></div>
        <div className="summary-row"><span>Height</span><span>{profile.height}</span></div>
        <div className="summary-row"><span>Body Type</span><span>{profile.bodyType}</span></div>
        <div className="summary-row"><span>Goal</span><span>{profile.goal}</span></div>
        <div className="summary-row"><span>Level</span><span>{profile.level}</span></div>
        <div className="summary-row"><span>Equipment</span><span>{profile.equipment.join(', ')}</span></div>
        <div className="summary-row"><span>Training Days</span><span>{profile.days} day{profile.days !== 1 ? 's' : ''} / week</span></div>
      </div>
      <button className="submit-btn" onClick={onGenerate}>Generate Workout</button>
      <button className="edit-btn" onClick={onEdit}>Edit Profile</button>
    </div>
  )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({ exercise }) {
  const [feedback, setFeedback] = useState([])
  const [uploading, setUploading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtube_search + ' proper form tutorial')}`

  async function handleVideoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setFeedbackError('')
    setFeedback([])
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('exercise', exercise.exercise)
      const res = await fetch('http://localhost:8000/form-feedback', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Feedback failed')
      }
      const data = await res.json()
      // Split numbered lines into an array
      const lines = data.feedback
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
      setFeedback(lines)
    } catch (err) {
      setFeedbackError(err.message || 'Could not analyze video. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="exercise-card">
      <div className="card-header">
        <span className="exercise-name">{exercise.exercise}</span>
        <span className="muscle-tag">{exercise.muscle_group}</span>
      </div>
      <div className="card-stats">
        {exercise.sets} sets &times; {exercise.reps} reps &nbsp;&mdash;&nbsp; Rest {exercise.rest_seconds}s
      </div>
      <div className="form-cue">{exercise.form_cue}</div>

      <div className="card-actions">
        <a className="demo-btn" href={youtubeUrl} target="_blank" rel="noreferrer">
          Watch Demo
        </a>
        <label className="form-upload-label">
          {uploading ? 'Analyzing...' : 'Upload My Form'}
          <input
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleVideoUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {feedbackError && <div className="feedback-error">{feedbackError}</div>}

      {feedback.length > 0 && (
        <div className="feedback-box">
          <div className="feedback-title">Form Feedback</div>
          <ol className="feedback-list">
            {feedback.map((line, i) => (
              <li key={i}>{line.replace(/^\d+[\.\)]\s*/, '')}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

// ─── Equipment Detector ───────────────────────────────────────────────────────

function EquipmentDetector({ onUseEquipment }) {
  const [detected, setDetected] = useState([])
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState('')

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setDetecting(true)
    setDetectError('')
    setDetected([])
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('http://localhost:8000/detect-equipment', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Detection failed')
      }
      const data = await res.json()
      setDetected(data.equipment)
    } catch (err) {
      setDetectError(err.message || 'Could not detect equipment. Try again.')
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div className="detector-section">
      <label className="upload-label">
        {detecting ? 'Analyzing...' : 'Upload Gym Photo'}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUpload}
          disabled={detecting}
        />
      </label>

      {detectError && <div className="error-banner">{detectError}</div>}

      {detected.length > 0 && (
        <div>
          <div className="pill-row">
            {detected.map((eq, i) => (
              <span key={i} className="pill">{eq}</span>
            ))}
          </div>
          <button className="use-equipment-btn" onClick={() => onUseEquipment(detected)}>
            Use this equipment for my workout
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Workout Screen ───────────────────────────────────────────────────────────

function WorkoutScreen({ profile, onBack, onEditProfile, onUpdateProfile }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateWorkout(profileToUse) {
    setLoading(true)
    setError('')
    setExercises([])
    try {
      const res = await fetch('http://localhost:8000/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToUse),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Server error')
      }
      const data = await res.json()
      setExercises(data.exercises)
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleUseEquipment(detectedEquipment) {
    const updated = { ...profile, equipment: detectedEquipment }
    onUpdateProfile(updated)
    generateWorkout(updated)
  }

  return (
    <div>
      <div className="workout-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>Your Workout</h1>
        <button className="header-edit-btn" onClick={onEditProfile}>Edit Profile</button>
      </div>

      <EquipmentDetector onUseEquipment={handleUseEquipment} />

      <button className="submit-btn" onClick={() => generateWorkout(profile)} disabled={loading}>
        {loading ? 'Generating...' : exercises.length > 0 ? 'Regenerate Workout' : 'Generate Workout'}
      </button>

      {loading && <Spinner label="Asking your AI trainer..." />}

      {error && <div className="error-banner">{error}</div>}

      {exercises.length > 0 && (
        <div className="exercise-list">
          {exercises.map((ex, i) => (
            <ExerciseCard key={i} exercise={ex} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [screen, setScreen] = useState('profile')

  useEffect(() => {
    const saved = localStorage.getItem('userProfile')
    if (saved) setProfile(JSON.parse(saved))
  }, [])

  function handleSave(newProfile) {
    setProfile(newProfile)
    setEditing(false)
    setScreen('profile')
  }

  function handleUpdateProfile(updated) {
    setProfile(updated)
    localStorage.setItem('userProfile', JSON.stringify(updated))
  }

  if (screen === 'workout' && profile) {
    return (
      <ErrorBoundary>
        <div className="container">
          <WorkoutScreen
            profile={profile}
            onBack={() => setScreen('profile')}
            onEditProfile={() => { setEditing(true); setScreen('profile') }}
            onUpdateProfile={handleUpdateProfile}
          />
        </div>
      </ErrorBoundary>
    )
  }

  const showForm = !profile || editing

  return (
    <ErrorBoundary>
      <div className="container">
        {showForm
          ? <ProfileForm initial={profile} onSave={handleSave} />
          : <ProfileSummary
              profile={profile}
              onEdit={() => setEditing(true)}
              onGenerate={() => setScreen('workout')}
            />
        }
      </div>
    </ErrorBoundary>
  )
}

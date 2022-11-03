export class StartRecordingElement extends HTMLElement {
  #chunks: BlobPart[] = []
  #mediaRecorder: MediaRecorder | null = null

  constructor() {
    super()
    if (!this.shadowRoot) {
      this.attachShadow({mode: 'open'})
      this.shadowRoot!.innerHTML = `
        <style>
          :host([recording]) > button {
            background: red;
            color: black;
          }
        </style>
        <link rel="stylesheet" href="./dist/index.css" />
        <div class="sound-clips"></div>
        <button><slot>Start recording</slot></button>
      `
    }
  }

  connectedCallback() {
    this.#button.addEventListener('click', this)
  }

  get #button(): HTMLElement {
    return this.shadowRoot!.querySelector('button')!
  }

  get #soundClips(): HTMLElement {
    return this.shadowRoot!.querySelector('.sound-clips')!
  }

  #saveRecording() {
    const clipName = prompt('Enter a name for your sound clip')

    const clipContainer = document.createElement('article')
    const clipLabel = document.createElement('p')
    const audio = document.createElement('audio')
    const deleteButton = document.createElement('button')

    clipContainer.classList.add('clip')
    audio.setAttribute('controls', '')
    deleteButton.textContent = 'Delete'
    clipLabel.textContent = clipName

    clipContainer.appendChild(audio)
    clipContainer.appendChild(clipLabel)
    clipContainer.appendChild(deleteButton)
    this.#soundClips.appendChild(clipContainer)

    const blob = new Blob(this.#chunks, {type: 'audio/ogg; codecs=opus'})
    this.#chunks = []
    const audioURL = window.URL.createObjectURL(blob)
    audio.src = audioURL

    deleteButton.onclick = event => {
      const evtTgt = event.target as HTMLElement
      evtTgt.parentNode?.parentNode?.removeChild(evtTgt.parentNode)
    }
  }

  set #recording(value: boolean) {
    if (value) {
      this.setAttribute('recording', '')
    } else {
      this.removeAttribute('recording')
    }
    this.#button.textContent = this.#recording ? 'Stop recording' : 'Start recording'
  }

  get #recording(): boolean {
    return this.hasAttribute('recording')
  }

  async handleEvent() {
    if (!this.#recording) {
      this.#recording = true
      const stream = await navigator.mediaDevices.getUserMedia({audio: true})
      this.#mediaRecorder = new MediaRecorder(stream)
      this.#mediaRecorder.ondataavailable = e => {
        this.#chunks.push(e.data)
      }
      this.#mediaRecorder.start()

      this.#mediaRecorder.onstop = () => this.#saveRecording()
    } else {
      this.#recording = false
      this.#mediaRecorder!.stop()
    }
  }
}

declare global {
  interface Window {
    StartRecordingElement: typeof StartRecordingElement
  }
  interface HTMLElementTagNameMap {
    'start-recording': StartRecordingElement
  }
}

if (!window.customElements.get('start-recording')) {
  window.StartRecordingElement = StartRecordingElement
  window.customElements.define('start-recording', StartRecordingElement)
}

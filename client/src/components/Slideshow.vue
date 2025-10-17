<template>
  <div class="slideshow-overlay" @click="$emit('close')">
    <button @click="$emit('close')" class="close-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>

    <img 
      :src="photos[currentIndex].src" 
      :alt="photos[currentIndex].title" 
      class="slideshow-img"
      @click.stop
    />

    <div class="slideshow-controls" @click.stop>
      <button @click="prev" class="nav-btn">上一张</button>
      <span class="slide-counter">{{ currentIndex + 1 }} / {{ photos.length }}</span>
      <button @click="next" class="nav-btn">下一张</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Slideshow',
  props: {
    photos: {
      type: Array,
      required: true
    },
    startIndex: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      currentIndex: this.startIndex
    }
  },
  methods: {
    prev() {
      this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length
    },
    next() {
      this.currentIndex = (this.currentIndex + 1) % this.photos.length
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    prev() {
      this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length
    },
    next() {
      this.currentIndex = (this.currentIndex + 1) % this.photos.length
    },
    handleKeydown(e) {
      if (e.key === 'ArrowLeft') this.prev()
      else if (e.key === 'ArrowRight') this.next()
      else if (e.key === 'Escape') this.$emit('close')
    }
  }
}
</script>

<style scoped>
.slideshow-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.9);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn svg {
  width: 1.5rem;
  height: 1.5rem;
}

.slideshow-img {
  max-height: 80vh;
  max-width: 90vw;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.slideshow-controls {
  position: absolute;
  bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-btn {
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.slide-counter {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}
</style>


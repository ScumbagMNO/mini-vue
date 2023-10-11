const queue: any[] = []
const activePreFlushCbs: any[] = []

const p = Promise.resolve()

export function nextTick(fn?) {
  return fn ? p.then(fn) : p
}

let isFlushPending = false
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  queueFlush()
}

function queueFlush() {
  if (isFlushPending) return
  isFlushPending = true
  nextTick(flushJobs)
}

export function queuePreFlushCb(job) {
  activePreFlushCbs.push(job)
  queueFlush()
}

function flushJobs() {
  isFlushPending = false

  flushPreFlushCbs()
  // component render
  let job
  while ((job = queue.shift())) {
    job && job()
  }
}

function flushPreFlushCbs() {
  for (let i = 0; i < activePreFlushCbs.length; i++) {
    activePreFlushCbs[i]()
  }
}

const queue: any[] = []

export function nextTick(fn) {
  return fn ? Promise.resolve().then(fn) : Promise.resolve()
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

function flushJobs() {
  isFlushPending = false
  let job
  while ((job = queue.shift())) {
    job && job()
  }
}

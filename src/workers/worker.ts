/* eslint-env worker */
const self = globalThis as unknown as DedicatedWorkerGlobalScope

self.addEventListener('message', async (e) => {
  if (e.data.target === 'encryptor') {
    const poseidon = await import('@radiusxyz/wasm-encryptor-zkp')
    console.log('in encryptor', e, e.data)
    const data = await poseidon.encrypt_threesixty_tx(
      e.data.txInfoToHash,
      e.data.s2_string,
      e.data.s2_field_hex,
      e.data.commitment_hex,
      e.data.idPath
    )

    self.postMessage({ target: 'encryptor', data })
  }
  if (e.data.target === 'timeLockPuzzle') {
    const timeLockPuzzle = await import('@radiusxyz/wasm-time-lock-puzzle-zkp')

    console.log('in timeLockPuzzle', e, e.data)
    const data = await timeLockPuzzle.get_time_lock_puzzle_proof(
      e.data.timeLockPuzzleParam,
      e.data.timeLockPuzzleSnarkParam
    )
    self.postMessage({ target: 'timeLockPuzzle', data })
  }
})

export default {} as any

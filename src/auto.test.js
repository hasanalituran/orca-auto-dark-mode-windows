import { describe, it, expect } from 'vitest'
import { autoTargetMode, parseTimeMinutes } from './worker'

const at = (h, m = 0) => h * 60 + m

describe('parseTimeMinutes', () => {
  it('parses HH:MM into minutes of day', () => {
    expect(parseTimeMinutes('00:00')).toBe(0)
    expect(parseTimeMinutes('07:00')).toBe(420)
    expect(parseTimeMinutes('21:30')).toBe(1290)
    expect(parseTimeMinutes('23:59')).toBe(1439)
    expect(parseTimeMinutes('7:05')).toBe(425)
  })
  it('rejects invalid times', () => {
    expect(parseTimeMinutes('24:00')).toBeNull()
    expect(parseTimeMinutes('12:60')).toBeNull()
    expect(parseTimeMinutes('nope')).toBeNull()
    expect(parseTimeMinutes('')).toBeNull()
  })
})

describe('autoTargetMode', () => {
  // light 07:00, dark 19:00 (daytime light window)
  const light = at(7)
  const dark = at(19)

  it('is light during the daytime window', () => {
    expect(autoTargetMode(at(12), light, dark)).toBe('light')
    expect(autoTargetMode(at(7), light, dark)).toBe('light')
    expect(autoTargetMode(at(18, 59), light, dark)).toBe('light')
  })

  it('is dark from the dark boundary through the night', () => {
    expect(autoTargetMode(at(19), light, dark)).toBe('dark')
    expect(autoTargetMode(at(23), light, dark)).toBe('dark')
    expect(autoTargetMode(at(0), light, dark)).toBe('dark')
    expect(autoTargetMode(at(6, 59), light, dark)).toBe('dark')
  })

  it('handles minute precision at the boundaries', () => {
    expect(autoTargetMode(at(7, 0), light, dark)).toBe('light')
    expect(autoTargetMode(at(6, 59), light, dark)).toBe('dark')
    expect(autoTargetMode(at(19, 0), light, dark)).toBe('dark')
    expect(autoTargetMode(at(18, 59), light, dark)).toBe('light')
  })

  it('supports overnight schedules (light at night)', () => {
    // light 19:00, dark 07:00 → dark during day, light at night
    const lightNight = at(19)
    const darkMorning = at(7)
    expect(autoTargetMode(at(12), lightNight, darkMorning)).toBe('dark')
    expect(autoTargetMode(at(22), lightNight, darkMorning)).toBe('light')
    expect(autoTargetMode(at(3), lightNight, darkMorning)).toBe('light')
    expect(autoTargetMode(at(6, 59), lightNight, darkMorning)).toBe('light')
  })

  it('defaults to dark when both boundaries are equal', () => {
    expect(autoTargetMode(at(12), at(9), at(9))).toBe('dark')
  })
})

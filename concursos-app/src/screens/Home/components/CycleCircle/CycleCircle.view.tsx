import { colors } from '@/constants/colors'
import type { PlannedSession } from '@/shared/interfaces/cycle'
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useEffect, useRef, useMemo } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

const SUBJECT_COLORS = [
  '#4F6CF7', '#FF9800', '#9C27B0', '#00BCD4', '#F44336', '#4CAF50',
  '#FF5722', '#3F51B5', '#009688', '#FFC107', '#E91E63', '#607D8B',
]

const DONE_COLOR = '#4CAF50'
const GAP_DEGREES = 3

interface Segment {
  session: PlannedSession
  color: string
  startDeg: number
  sweepDeg: number
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToXY(cx, cy, r, startDeg)
  const end = polarToXY(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

interface Props {
  sessions: PlannedSession[]
  subjectColorMap: Map<string, string>
  centerState: 'no_cycle' | 'all_done' | 'in_progress' | 'next_pending'
  centerSubjectName: string
  centerTimeLabel: string   // HH:mm:ss for pending/elapsed; empty for no_cycle/all_done
  onStart: () => void
  onContinue: () => void
}

export const CycleCircleView = ({
  sessions,
  subjectColorMap,
  centerState,
  centerSubjectName,
  centerTimeLabel,
  onStart,
  onContinue,
}: Props) => {
  const size = Dimensions.get('window').width * 0.80
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = 20
  const r = (size - strokeWidth) / 2

  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (centerState === 'in_progress') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [centerState])

  const totalSeconds = useMemo(
    () => sessions.reduce((s, p) => s + p.allocatedSeconds, 0),
    [sessions]
  )

  const segments = useMemo<Segment[]>(() => {
    if (!totalSeconds) return []
    let currentDeg = 0
    return sessions.map((session) => {
      const sweep = Math.max(
        0,
        (session.allocatedSeconds / totalSeconds) * 360 - GAP_DEGREES
      )
      const seg: Segment = {
        session,
        color: session.status === 'done'
          ? DONE_COLOR
          : (subjectColorMap.get(session.subjectId) ?? SUBJECT_COLORS[0]),
        startDeg: currentDeg,
        sweepDeg: sweep,
      }
      currentDeg += (session.allocatedSeconds / totalSeconds) * 360
      return seg
    })
  }, [sessions, subjectColorMap, totalSeconds])

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track circle */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={colors.background.elevated}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Segments */}
        {segments.map((seg) => {
          if (seg.sweepDeg <= 0) return null
          const opacity = seg.session.status === 'in_progress' ? undefined : 1
          return (
            <Path
              key={seg.session.id}
              d={arcPath(cx, cy, r, seg.startDeg, seg.startDeg + seg.sweepDeg)}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
              opacity={opacity}
            />
          )
        })}
      </Svg>

      {/* Pulsing overlay for in_progress segment */}
      {centerState === 'in_progress' && segments.length > 0 && (() => {
        const inProg = segments.find((s) => s.session.status === 'in_progress')
        if (!inProg) return null
        return (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]} pointerEvents="none">
            <Svg width={size} height={size}>
              <Path
                d={arcPath(cx, cy, r, inProg.startDeg, inProg.startDeg + inProg.sweepDeg)}
                stroke={inProg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        )
      })()}

      {/* Center content */}
      <View style={styles.center} pointerEvents="box-none">
        {centerState === 'no_cycle' && (
          <Text style={styles.centerLabel}>Nenhum ciclo ativo</Text>
        )}
        {centerState === 'all_done' && (
          <Text style={styles.centerLabel}>Ciclo concluído!</Text>
        )}
        {(centerState === 'next_pending' || centerState === 'in_progress') && (
          <>
            <Text style={styles.subjectName} numberOfLines={2}>{centerSubjectName}</Text>
            <Text style={styles.timeLabel}>{centerTimeLabel}</Text>
            {centerState === 'next_pending' && (
              <TouchableOpacity style={styles.actionButton} onPress={onStart}>
                <Text style={styles.actionText}>Iniciar</Text>
              </TouchableOpacity>
            )}
            {centerState === 'in_progress' && (
              <TouchableOpacity style={styles.actionButton} onPress={onContinue}>
                <Text style={styles.actionText}>Continuar</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'center', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '55%',
    gap: 6,
  },
  centerLabel: { color: colors.grayscale.gray400, fontSize: 14, textAlign: 'center' },
  subjectName: {
    color: colors.grayscale.gray100,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeLabel: { color: colors.grayscale.gray400, fontSize: 13, fontVariant: ['tabular-nums'] },
  actionButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})

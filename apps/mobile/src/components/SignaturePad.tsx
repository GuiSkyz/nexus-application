import React, { useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DigitalSignature, SignaturePoint, SignatureStroke } from "../types";
import { colors, radius, spacing } from "../theme/tokens";

interface SignaturePadProps {
  signerName: string;
  onChange: (signature: DigitalSignature | null) => void;
}

interface SignatureSegment {
  key: string;
  left: number;
  top: number;
  width: number;
  angle: number;
}

const pointFromEvent = (event: GestureResponderEvent): SignaturePoint => ({
  x: Math.max(0, event.nativeEvent.locationX),
  y: Math.max(0, event.nativeEvent.locationY),
});

const buildDataUrl = (strokes: SignatureStroke[]): string => {
  const paths = strokes
    .filter((stroke) => stroke.points.length > 0)
    .map((stroke) => {
      const [first, ...remaining] = stroke.points;
      const commands = [
        `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`,
        ...remaining.map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`),
      ];
      return `<path d="${commands.join(" ")}" fill="none" stroke="#061F4A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 220">${paths}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const SignaturePad: React.FC<SignaturePadProps> = ({
  signerName,
  onChange,
}) => {
  const [strokes, setStrokes] = useState<SignatureStroke[]>([]);
  const strokesRef = useRef<SignatureStroke[]>([]);

  const publishSignature = (nextStrokes: SignatureStroke[]) => {
    strokesRef.current = nextStrokes;
    setStrokes(nextStrokes);
    const hasContent = nextStrokes.some((stroke) => stroke.points.length > 1);
    onChange(
      hasContent
        ? {
            signerName,
            signedAt: new Date().toISOString(),
            strokes: nextStrokes,
            dataUrl: buildDataUrl(nextStrokes),
          }
        : null
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          publishSignature([
            ...strokesRef.current,
            { points: [pointFromEvent(event)] },
          ]);
        },
        onPanResponderMove: (event) => {
          const current = strokesRef.current;
          if (current.length === 0) return;
          const next = current.map((stroke, index) =>
            index === current.length - 1
              ? { points: [...stroke.points, pointFromEvent(event)] }
              : stroke
          );
          publishSignature(next);
        },
      }),
    [signerName]
  );

  const segments = useMemo<SignatureSegment[]>(() => {
    const result: SignatureSegment[] = [];
    strokes.forEach((stroke, strokeIndex) => {
      stroke.points.slice(1).forEach((point, pointIndex) => {
        const previous = stroke.points[pointIndex];
        const deltaX = point.x - previous.x;
        const deltaY = point.y - previous.y;
        const width = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        result.push({
          key: `${strokeIndex}-${pointIndex}`,
          left: (previous.x + point.x) / 2 - width / 2,
          top: (previous.y + point.y) / 2 - 1.2,
          width,
          angle: Math.atan2(deltaY, deltaX),
        });
      });
    });
    return result;
  }, [strokes]);

  const clear = () => publishSignature([]);

  return (
    <View>
      <View style={styles.pad} {...panResponder.panHandlers}>
        {segments.map((segment) => (
          <View
            key={segment.key}
            style={[
              styles.segment,
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                transform: [{ rotateZ: `${segment.angle}rad` }],
              },
            ]}
          />
        ))}
        {segments.length === 0 && (
          <Text style={styles.placeholder}>
            Assine com o dedo dentro desta área
          </Text>
        )}
      </View>
      <View style={styles.footer}>
        <View>
          <Text style={styles.signer}>{signerName}</Text>
          <Text style={styles.caption}>Assinatura vinculada ao horário da conclusão</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={clear}
          style={styles.clearButton}
        >
          <Text style={styles.clearButtonText}>Limpar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pad: {
    height: 150,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
  },
  segment: {
    position: "absolute",
    height: 2.4,
    borderRadius: 2,
    backgroundColor: colors.navy[900],
  },
  placeholder: {
    position: "absolute",
    left: spacing[4],
    right: spacing[4],
    top: 62,
    textAlign: "center",
    color: colors.text.muted,
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingTop: spacing[2],
  },
  signer: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  caption: {
    color: colors.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
  clearButton: {
    minHeight: 40,
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.surface.subtle,
  },
  clearButtonText: {
    color: colors.blue[600],
    fontSize: 12,
    fontWeight: "700",
  },
});

"use client";

import { Box, Stack, Text } from "@mantine/core";
import Lottie from "lottie-react";

// Inline animation data for common animations
// These are simplified versions - you can replace with your own from LottieFiles

const loadingAnimation = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: "Loading",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [360] },
            { t: 120, s: [360] },
          ],
        },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [60, 60] },
          nm: "Ellipse",
        },
        {
          ty: "st",
          c: { a: 0, k: [0.227, 0.388, 0.937, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 6 },
          lc: 2,
          lj: 1,
          nm: "Stroke",
          d: [
            { n: "d", nm: "dash", v: { a: 0, k: 40 } },
            { n: "g", nm: "gap", v: { a: 0, k: 100 } },
            { n: "o", nm: "offset", v: { a: 0, k: 0 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
  ],
};

const successAnimation = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Success",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Check",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [110, 110, 100] },
            { t: 20, s: [110, 110, 100], e: [100, 100, 100] },
            { t: 30, s: [100, 100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [80, 80] },
          nm: "Circle",
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.133, 0.773, 0.369, 1] },
          o: { a: 0, k: 100 },
          nm: "Fill",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Checkmark",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "sh",
          ks: {
            a: 0,
            k: {
              c: false,
              v: [
                [-15, 0],
                [-5, 10],
                [15, -10],
              ],
              i: [
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              o: [
                [0, 0],
                [0, 0],
                [0, 0],
              ],
            },
          },
          nm: "Path",
        },
        {
          ty: "st",
          c: { a: 0, k: [1, 1, 1, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 5 },
          lc: 2,
          lj: 2,
          nm: "Stroke",
        },
        {
          ty: "tm",
          s: { a: 0, k: 0 },
          e: {
            a: 1,
            k: [
              { t: 15, s: [0], e: [100] },
              { t: 35, s: [100] },
            ],
          },
          o: { a: 0, k: 0 },
          nm: "Trim",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
    },
  ],
};

const waitingAnimation = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 180,
  w: 200,
  h: 200,
  nm: "Waiting",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Dots",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [-30, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [16, 16], e: [24, 24] },
              { t: 30, s: [24, 24], e: [16, 16] },
              { t: 60, s: [16, 16] },
            ],
          },
          nm: "Dot1",
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.227, 0.388, 0.937, 1] },
          o: { a: 0, k: 100 },
          nm: "Fill1",
        },
      ],
      ip: 0,
      op: 180,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Dot2",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: {
            a: 1,
            k: [
              { t: 20, s: [16, 16], e: [24, 24] },
              { t: 50, s: [24, 24], e: [16, 16] },
              { t: 80, s: [16, 16] },
            ],
          },
          nm: "Dot2",
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.227, 0.388, 0.937, 1] },
          o: { a: 0, k: 100 },
          nm: "Fill2",
        },
      ],
      ip: 0,
      op: 180,
      st: 0,
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Dot3",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [30, 0] },
          s: {
            a: 1,
            k: [
              { t: 40, s: [16, 16], e: [24, 24] },
              { t: 70, s: [24, 24], e: [16, 16] },
              { t: 100, s: [16, 16] },
            ],
          },
          nm: "Dot3",
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.227, 0.388, 0.937, 1] },
          o: { a: 0, k: 100 },
          nm: "Fill3",
        },
      ],
      ip: 0,
      op: 180,
      st: 0,
    },
  ],
};

const emptyAnimation = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Empty",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Box",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "rc",
          d: 1,
          s: { a: 0, k: [60, 50] },
          p: { a: 0, k: [0, 10] },
          r: { a: 0, k: 4 },
          nm: "Box",
        },
        {
          ty: "st",
          c: { a: 0, k: [0.6, 0.6, 0.6, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 3 },
          lc: 2,
          lj: 2,
          nm: "Stroke",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
    },
  ],
};

type AnimationType = "loading" | "success" | "waiting" | "empty";

interface LottieAnimationProps {
  type: AnimationType;
  size?: number;
  message?: string;
  loop?: boolean;
}

const animations: Record<AnimationType, unknown> = {
  loading: loadingAnimation,
  success: successAnimation,
  waiting: waitingAnimation,
  empty: emptyAnimation,
};

export function LottieAnimation({
  type,
  size = 120,
  message,
  loop = true,
}: LottieAnimationProps) {
  const animationData = animations[type];

  return (
    <Stack align="center" gap="md" py="xl">
      <Box style={{ width: size, height: size }}>
        <Lottie
          animationData={animationData}
          loop={type === "success" ? false : loop}
          style={{ width: "100%", height: "100%" }}
        />
      </Box>
      {message && (
        <Text size="sm" c="dimmed" ta="center">
          {message}
        </Text>
      )}
    </Stack>
  );
}

export function LoadingAnimation({
  message = "Memuat data...",
}: {
  message?: string;
}) {
  return <LottieAnimation type="loading" message={message} />;
}

export function SuccessAnimation({
  message = "Berhasil!",
}: {
  message?: string;
}) {
  return <LottieAnimation type="success" message={message} loop={false} />;
}

export function WaitingAnimation({
  message = "Menunggu...",
}: {
  message?: string;
}) {
  return <LottieAnimation type="waiting" message={message} />;
}

export function EmptyAnimation({
  message = "Tidak ada data",
}: {
  message?: string;
}) {
  return <LottieAnimation type="empty" message={message} loop={false} />;
}

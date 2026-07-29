import { createTamagui } from 'tamagui'
import { config } from '@tamagui/config/v3'
import { createAnimations } from '@tamagui/animations-react-native'

const animations = createAnimations({
  standard: {
    type: 'spring',
    damping: 22,
    mass: 0.8,
    stiffness: 220,
  },
  gentle: {
    type: 'spring',
    damping: 24,
    stiffness: 180,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 0.8,
    stiffness: 320,
  },
})

const appConfig = createTamagui({
  ...config,
  animations,
  themeClassNameOnRoot: false,
})

export type AppConfig = typeof appConfig

declare module 'tamagui' {
  // overrides TamaguiCustomConfig so your custom types
  // work everywhere you import `tamagui`
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig

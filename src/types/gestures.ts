export type GestureState =
  | 'IDLE'
  | 'PINCH_ROTATE'
  | 'PINCH_ZOOM'
  | 'EXPLODE'
  | 'POINT_SELECT'
  | 'OPEN_PALM_RESET'

export interface GestureParams {
  state: GestureState
  rotationDelta?: [number, number]
  zoomDelta?: number
  spreadFactor?: number
  pointTarget?: [number, number] // normalized screen coords
}

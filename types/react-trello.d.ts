declare module 'react-trello' {
  import React from 'react';

  export interface Card {
    id: string;
    title: string;
    description?: string;
    label?: string;
    laneId: string;
    metadata?: any;
  }

  export interface Lane {
    id: string;
    title: string;
    cards: Card[];
    wip?: number;
    editable?: boolean;
    droppable?: boolean;
    style?: React.CSSProperties;
    className?: string;
  }

  export interface BoardData {
    lanes: Lane[];
  }

  export interface BoardProps {
    data: BoardData;
    draggable?: boolean;
    laneDraggable?: boolean;
    cardDraggable?: boolean;
    collapsibleLanes?: boolean;
    editable?: boolean;
    canAddLanes?: boolean;
    canAddCards?: boolean;
    canEditLanes?: boolean;
    canEditCards?: boolean;
    editLaneTitle?: boolean;
    editCardTitle?: boolean;
    style?: React.CSSProperties;
    className?: string;
    onDataChange?: (data: BoardData) => void;
    onCardAdd?: (card: Card, laneId: string) => void;
    onCardDelete?: (cardId: string, laneId: string) => void;
    onCardMoveAcrossLanes?: (fromLaneId: string, toLaneId: string, cardId: string, index: number) => void;
    onLaneAdd?: (params: any) => void;
    onLaneDelete?: (laneId: string) => void;
    onLaneUpdate?: (laneId: string, data: any) => void;
    onCardClick?: (cardId: string, metadata: any, laneId: string) => void;
    onLaneClick?: (laneId: string) => void;
    onCardMove?: (fromLaneId: string, toLaneId: string, cardId: string, index: number) => void;
    onCardUpdate?: (laneId: string, cardId: string, data: any) => void;
    onCardEdit?: (cardId: string, metadata: any, laneId: string) => void;
    onBeforeCardDelete?: (callback: () => void) => void;
    onBeforeLaneDelete?: (callback: () => void) => void;
    onBeforeCardAdd?: (callback: () => void) => void;
    onBeforeLaneAdd?: (callback: () => void) => void;
    tagStyle?: React.CSSProperties;
    cardStyle?: React.CSSProperties;
    laneStyle?: React.CSSProperties;
    components?: {
      Card?: React.ComponentType<any>;
      CardHeader?: React.ComponentType<any>;
      CardBody?: React.ComponentType<any>;
      CardFooter?: React.ComponentType<any>;
      Lane?: React.ComponentType<any>;
      LaneHeader?: React.ComponentType<any>;
      AddCardLink?: React.ComponentType<any>;
      AddLaneForm?: React.ComponentType<any>;
      AddCardForm?: React.ComponentType<any>;
    };
    hideCardDeleteIcon?: boolean;
    hideLaneDeleteIcon?: boolean;
    hideCardAddIcon?: boolean;
    hideLaneAddIcon?: boolean;
    cardBorderRadius?: string;
    laneBorderRadius?: string;
    cardShadow?: string;
    laneShadow?: string;
    cardBackgroundColor?: string;
    laneBackgroundColor?: string;
    cardColor?: string;
    laneColor?: string;
    cardFontSize?: string;
    laneFontSize?: string;
    cardFontWeight?: string;
    laneFontWeight?: string;
    cardPadding?: string;
    lanePadding?: string;
    cardMargin?: string;
    laneMargin?: string;
    cardBorder?: string;
    laneBorder?: string;
    cardBorderColor?: string;
    laneBorderColor?: string;
    cardBorderWidth?: string;
    laneBorderWidth?: string;
    cardBorderStyle?: string;
    laneBorderStyle?: string;
    cardBorderRadius?: string;
    laneBorderRadius?: string;
    cardBoxShadow?: string;
    laneBoxShadow?: string;
    cardBackgroundImage?: string;
    laneBackgroundImage?: string;
    cardBackgroundSize?: string;
    laneBackgroundSize?: string;
    cardBackgroundPosition?: string;
    laneBackgroundPosition?: string;
    cardBackgroundRepeat?: string;
    laneBackgroundRepeat?: string;
    cardBackgroundAttachment?: string;
    laneBackgroundAttachment?: string;
    cardBackgroundOrigin?: string;
    laneBackgroundOrigin?: string;
    cardBackgroundClip?: string;
    laneBackgroundClip?: string;
    cardBackgroundBlendMode?: string;
    laneBackgroundBlendMode?: string;
    cardOpacity?: string;
    laneOpacity?: string;
    cardTransform?: string;
    laneTransform?: string;
    cardTransition?: string;
    laneTransition?: string;
    cardAnimation?: string;
    laneAnimation?: string;
    cardCursor?: string;
    laneCursor?: string;
    cardUserSelect?: string;
    laneUserSelect?: string;
    cardPointerEvents?: string;
    lanePointerEvents?: string;
    cardOverflow?: string;
    laneOverflow?: string;
    cardZIndex?: string;
    laneZIndex?: string;
    cardPosition?: string;
    lanePosition?: string;
    cardTop?: string;
    laneTop?: string;
    cardRight?: string;
    laneRight?: string;
    cardBottom?: string;
    laneBottom?: string;
    cardLeft?: string;
    laneLeft?: string;
    cardFloat?: string;
    laneFloat?: string;
    cardClear?: string;
    laneClear?: string;
    cardDisplay?: string;
    laneDisplay?: string;
    cardVisibility?: string;
    laneVisibility?: string;
    cardClip?: string;
    laneClip?: string;
    cardZoom?: string;
    laneZoom?: string;
    cardFilter?: string;
    laneFilter?: string;
    cardBackfaceVisibility?: string;
    laneBackfaceVisibility?: string;
    cardPerspective?: string;
    lanePerspective?: string;
    cardPerspectiveOrigin?: string;
    lanePerspectiveOrigin?: string;
    cardTransformStyle?: string;
    laneTransformStyle?: string;
    cardTransformOrigin?: string;
    laneTransformOrigin?: string;
    cardTransformBox?: string;
    laneTransformBox?: string;
    cardBackfaceVisibility?: string;
    laneBackfaceVisibility?: string;
    cardPerspective?: string;
    lanePerspective?: string;
    cardPerspectiveOrigin?: string;
    lanePerspectiveOrigin?: string;
    cardTransformStyle?: string;
    laneTransformStyle?: string;
    cardTransformOrigin?: string;
    laneTransformOrigin?: string;
    cardTransformBox?: string;
    laneTransformBox?: string;
  }

  const Board: React.ComponentType<BoardProps>;
  export default Board;
} 
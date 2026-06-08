import './Card.css';

const IMG_SOURCE = '/card-map.png';
const IMG_WIDTH = 8716;
const IMG_HEIGHT = 3984;
const COLUMNS = 13;
const ROWS = 4;

const IMG_BACK_SOURCE = '/diamond-shape-cut.jpg';
const IMG_BACK_WIDTH = 152;
const IMG_BACK_HEIGHT = 327;

const CUTOUT_WIDTH = IMG_WIDTH / COLUMNS;
const CUTOUT_HEIGHT = IMG_HEIGHT / ROWS;
const ASPECT_RATIO = CUTOUT_WIDTH / CUTOUT_HEIGHT;

function Card({ 
    card_id = 0, 
    color_id = 0,
    size, 
    flipped = false,
    className = '',
    rotation = 0,
    style = {},
    flipVertically = false,
    backOverlaySrc = '',
    backOverlayStyle = {}
}) {
    const column = card_id;
    const row = color_id;

	const setHeight = Number(size);

	let width = CUTOUT_WIDTH;
	let height = CUTOUT_HEIGHT;

	if (setHeight > 0) {
		width = size * ASPECT_RATIO;
		height = size;
	}
    const scale = height / CUTOUT_HEIGHT;

    const rootClassName = ['card', className, flipped ? 'flipped' : null].filter(Boolean).join(' ');

    const frontOffsetX = column * CUTOUT_WIDTH;
    const frontOffsetY = row * CUTOUT_HEIGHT;

    const cardStyle = {
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg) ${flipVertically ? 'scaleX(-1)' : ''}`.trim(),
        ...style,
    }

    const frontStyle = {
  position: 'absolute',
  left: `${-frontOffsetX * scale}px`,
  top: `${-frontOffsetY * scale}px`,
  width: `${IMG_WIDTH * scale}px`,
  height: `${IMG_HEIGHT * scale}px`,
  maxWidth: 'none',
  maxHeight: 'none',
  display: 'block',
};

    const backStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'fill',
    };

    return (
        <div className={rootClassName}
            style={cardStyle}
            aria-label={flipped ? 'face-down-card' : `card-${row}-${column}`}
        >
            <div className={flipped ? "card-inner flipped" : "card-inner"}>
                <div className="card-face card-face--front">
                    <img 
                        className="front"
                        src={IMG_SOURCE}
                        style={frontStyle}
                        alt="card front"
                    />
                </div>
                <div className="card-face card-face--back">
                    <img
                        className="back"
                        src={IMG_BACK_SOURCE}
                        style={backStyle}
                        alt="card back"
                    />
                    {backOverlaySrc ? (
                        <img
                            className="back card-face__overlay"
                            src={backOverlaySrc}
                            style={{ ...backStyle, ...backOverlayStyle }}
                            alt="card back overlay"
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default Card;
const TooltipColor = ({fill}: {fill: string}) => (
  <span
    style={{
      height: 12,
      width: 12,
      backgroundColor: fill,
      display: 'inline-block',
      marginRight: 12,
    }}
  />
);

export default TooltipColor;

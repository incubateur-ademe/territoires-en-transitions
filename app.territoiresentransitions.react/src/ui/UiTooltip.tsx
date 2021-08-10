import Tooltip from "@material-ui/core/Tooltip";
import { useState } from "react";

type UiTooltipProps = {
  content: React.ReactElement | string;
  placement?: "top" | "left" | "bottom";
  children: React.ReactElement;
  disable?: boolean;
  delay?: number;
};

export const UiTooltip = ({
  children,
  content,
  disable,
  placement,
  delay,
}: UiTooltipProps) => {
  return (
    <RenderWrapperOnHover
      WrapperComponent={Tooltip}
      wrapperProps={{
        title: content,
        placement: placement ?? "top",
        disableHoverListener: disable,
        children: children,
        enterDelay: delay,
      }}
    />
  );
};

type WithChildren = { children: React.ReactElement };

type RenderWrapperOnHoverProps<P extends WithChildren> = {
  WrapperComponent: React.ComponentType<P>;
  wrapperProps: P;
};

const RenderWrapperOnHover = <P extends WithChildren>({
  WrapperComponent,
  wrapperProps,
}: RenderWrapperOnHoverProps<P>) => {
  const { children } = wrapperProps;
  const [isHovered, setIsHovered] = useState(false);

  const renderWrapped = () => (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );

  return isHovered ? (
    <WrapperComponent {...wrapperProps} children={renderWrapped()} />
  ) : (
    renderWrapped()
  );
};

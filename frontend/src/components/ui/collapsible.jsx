import React, { useState, useRef, useEffect } from "react";

export const Collapsible = ({ children, open, onOpenChange, className = "" }) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open, onOpenChange });
        }
        return child;
      })}
    </div>
  );
};

export const CollapsibleTrigger = ({ children, open, onOpenChange, asChild }) => {
  const handleClick = (e) => {
    if (onOpenChange) {
      onOpenChange(!open);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        handleClick(e);
        if (children.props.onClick) {
          children.props.onClick(e);
        }
      },
    });
  }

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
};

export const CollapsibleContent = ({ children, open, className = "" }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(open ? "auto" : "0px");

  useEffect(() => {
    if (open) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(`${contentHeight}px`);
      const timer = setTimeout(() => {
        setHeight("auto");
      }, 300);
      return () => clearTimeout(timer);
    } else {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        setHeight(`${contentHeight}px`);
        setTimeout(() => {
          setHeight("0px");
        }, 10);
      } else {
        setHeight("0px");
      }
    }
  }, [open]);

  return (
    <div
      ref={contentRef}
      className={`overflow-hidden transition-all duration-300 ease-in-out ${className}`}
      style={{ height }}
    >
      {children}
    </div>
  );
};

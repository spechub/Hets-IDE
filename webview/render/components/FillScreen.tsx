import * as React from "react";

type State = {
  width: number;
  height: number;
};

type Props = {
  children: (props: { width: number; height: number }) => JSX.Element;
};

export class FillScreen extends React.Component<Props, State> {
  timer: NodeJS.Timeout;

  private sizeOffset: { width: number; height: number };

  constructor(props: Props) {
    super(props);

    this.sizeOffset = {
      width: 18,
      height: 10
    };

    this.state = {
      width:
        (window.innerWidth ||
          document.documentElement.clientWidth ||
          document.body.clientWidth) - this.sizeOffset.width,
      height:
        (window.innerHeight ||
          document.documentElement.clientHeight ||
          document.body.clientHeight) - this.sizeOffset.height
    };

    this.handleResize = this.handleResize.bind(this);

    window.addEventListener("resize", () => {
      clearTimeout(this.timer);
      this.timer = setTimeout(this.handleResize, 100);
    });
  }

  componentDidMount() {
    this.handleResize();
  }

  private handleResize() {
    this.setState({
      width:
        (window.innerWidth ||
          document.documentElement.clientWidth ||
          document.body.clientWidth) - this.sizeOffset.width,
      height:
        (window.innerHeight ||
          document.documentElement.clientHeight ||
          document.body.clientHeight) - this.sizeOffset.height
    });
  }

  render() {
    const { children } = this.props;
    return children({
      width: this.state.width,
      height: this.state.height
    });
  }
}

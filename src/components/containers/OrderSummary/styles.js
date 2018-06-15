import css from 'styled-jsx/css'

export default css`
  .zygoteOrderSummaryContainer {
    background-color: #f8f8f8;
    border: 1px solid #e8e9e9;
    border-top: none;
    padding: 15px;
    margin: -20px -20px 20px -20px;
  }
  .zygoteAnimate {
    transform: scaleY(0);
    transform-origin: top;
    transition: transform 0.5s ease-in-out;
  }
  .zygoteAnimMount {
    transform: scaleY(1);
  }
`

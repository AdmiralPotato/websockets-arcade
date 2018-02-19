window.shapeDefsComponent = {
  template: `
    <g class="shape-defs">
      <vector-text-defs />
      <defs>
        <polygon id="ship" points="1,0 -1,-1 -0.5,0 -1,1" />
        <path id="twinkle" d="M0.2,0.2L-0.2,-0.2Z M-0.2,0.2L0.2,-0.2Z M0.6,0L1,0Z M-0.6,0L-1,0Z M0,0.6L0,1Z M0,-0.6L0,-1Z" />
        <path
          id="petal"
          transform="translate(-1,-1)"
          d="M2,1A1.01269,1.01269,0,0,0,1.99484.89776.99969.99969,0,0,0,1.97968.79847L1.97033.75724A.0535.0535,0,0,0,1.90257.719L1.526.83623a.0537.0537,0,0,0-.03622.06251c0,.00017.006.03333.00768.05014a.50773.50773,0,0,1,0,.10224c-.00171.01681-.00764.05-.00768.05014a.0537.0537,0,0,0,.03622.06251l.37661.11726a.0535.0535,0,0,0,.06776-.03827l.00935-.04123a.99969.99969,0,0,0,.01516-.09929A1.01269,1.01269,0,0,0,2,1Z"
        />
        <rect id="bounding-rect" x="-1" y="-1" width="2" height="2" />
        <clipPath id="clipping-rect">
          <use xlink:href="#bounding-rect" />
        </clipPath>
      </defs>
    </g>
  `
}

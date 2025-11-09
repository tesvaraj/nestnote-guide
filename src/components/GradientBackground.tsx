const GradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="700 300 600 400" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="blur-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="200" />
          </filter>
          <pattern id="noise-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <filter id="noiseFilter">
              <feTurbulence type="fractalNoise" baseFrequency="4" numOctaves="4" stitchTiles="stitch"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
          </pattern>
        </defs>
        
        {/* Background */}
        <rect width="1920" height="1080" fill="#D4C4B8"/>
        
        {/* Gradient blobs */}
        <g filter="url(#blur-filter)">
          <path 
            d="M1235.18 -683.309C2048.19 22.6329 2461.29 878.186 2157.88 1227.62C1995.95 1414.11 1662.68 1418.76 1263.5 1275.25C1379.09 1281.84 1470.05 1255.48 1525.17 1192C1719.23 968.505 1395.43 369.565 801.931 -145.77C208.437 -661.105 -430.004 -897.687 -624.068 -674.191C-689.22 -599.156 -696.001 -481.803 -653.802 -339.503C-897.379 -754.136 -962.06 -1126.4 -786.295 -1328.82C-482.877 -1678.26 422.168 -1389.25 1235.18 -683.309Z" 
            fill="#FFFFD9"
          />
          <path 
            d="M824.529 -114.823C1585.49 545.921 1972.14 1346.7 1688.15 1673.76C1536.59 1848.31 1224.65 1852.66 851.015 1718.33C959.217 1724.51 1044.36 1699.83 1095.95 1640.42C1277.59 1431.23 974.516 870.636 419.02 388.294C-136.476 -94.0466 -734.042 -315.481 -915.681 -106.294C-976.663 -36.0623 -983.009 73.7798 -943.51 206.972C-1171.49 -181.114 -1232.03 -529.542 -1067.52 -719.006C-783.528 -1046.07 63.5712 -775.568 824.529 -114.823Z" 
            fill="#89AFFF"
          />
          <path 
            d="M474.646 91.3236C1150.9 678.52 1494.52 1390.16 1242.14 1680.82C1072.5 1876.18 676.79 1831.63 230.199 1603.11C405.257 1629.8 557.262 1594.25 648.388 1489.3C840.583 1267.95 689.196 821.783 310.256 492.747C-68.6829 163.711 -531.679 76.411 -723.874 297.755C-840.72 432.324 -830.571 649.991 -719.505 873.916C-1205 353.254 -1421.43 -198.416 -1206.8 -445.607C-954.416 -736.265 -201.608 -495.873 474.646 91.3236Z" 
            fill="#426CFF"
          />
        </g>
        
        {/* Noise overlay */}
        <rect 
          width="1920" 
          height="1080" 
          fill="url(#noise-pattern)" 
          fillOpacity="0.25" 
          style={{ mixBlendMode: 'overlay' }}
        />
      </svg>
    </div>
  );
};

export default GradientBackground;

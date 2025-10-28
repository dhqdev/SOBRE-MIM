import styled from 'styled-components';

const GitHubTooltip = () => {
  return (
    <StyledWrapper>
      <div className="tooltip-container">
        <div className="tooltip">
          <div className="profile">
            <div className="user">
              <div className="img">DF</div>
              <div className="details">
                <div className="name">David Fernandes</div>
                <div className="username">@dhqdev</div>
              </div>
            </div>
            <div className="about">Full-Stack Developer</div>
          </div>
        </div>
        <div className="text">
          <a className="icon" href="https://github.com/dhqdev" target="_blank" rel="noopener noreferrer">
            <div className="layer">
              <span />
              <span />
              <span />
              <span />
              <span className="fab fa-github">
                <svg viewBox="0 0 496 512" height="1em">
                  <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
                </svg>
              </span>
            </div>
            <div className="text">GitHub</div>
          </a>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .tooltip-container {
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 17px;
    border-radius: 10px;
  }

  .tooltip {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s;
    border-radius: 15px;
    box-shadow: inset 5px 5px 5px rgba(0, 0, 0, 0.2),
      inset -5px -5px 15px rgba(255, 255, 255, 0.1),
      5px 5px 15px rgba(0, 0, 0, 0.3), -5px -5px 15px rgba(255, 255, 255, 0.1);
    z-index: 1000;
  }

  .profile {
    background: #2a2b2f;
    border-radius: 10px 15px;
    padding: 10px;
    border: 1px solid rgba(88, 166, 255, 0.5);
    width: 200px;
  }

  .tooltip-container:hover .tooltip {
    top: -150px;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .icon {
    text-decoration: none;
    color: #fff;
    display: block;
    position: relative;
  }
  
  .layer {
    width: 85px;
    height: 85px;
    transition: transform 0.3s;
  }
  
  .icon:hover .layer {
    transform: rotate(-35deg) skew(20deg);
  }
  
  .layer span {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    border: 1px solid #fff;
    border-radius: 5px;
    transition: all 0.3s;
  }

  .layer span,
  .text {
    color: #58a6ff;
    border-color: #58a6ff;
  }

  .icon:hover .layer span {
    box-shadow: -1px 1px 3px #58a6ff;
  }
  
  .icon .text {
    position: absolute;
    left: 50%;
    bottom: -5px;
    opacity: 0;
    font-weight: 500;
    transform: translateX(-50%);
    transition: bottom 0.3s ease, opacity 0.3s ease;
  }
  
  .icon:hover .text {
    bottom: -35px;
    opacity: 1;
  }

  .icon:hover .layer span:nth-child(1) {
    opacity: 0.2;
  }
  
  .icon:hover .layer span:nth-child(2) {
    opacity: 0.4;
    transform: translate(5px, -5px);
  }
  
  .icon:hover .layer span:nth-child(3) {
    opacity: 0.6;
    transform: translate(10px, -10px);
  }
  
  .icon:hover .layer span:nth-child(4) {
    opacity: 0.8;
    transform: translate(15px, -15px);
  }
  
  .icon:hover .layer span:nth-child(5) {
    opacity: 1;
    transform: translate(20px, -20px);
  }

  .layer span.fab {
    font-size: 45px;
    line-height: 85px;
    text-align: center;
    fill: #58a6ff;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .user {
    display: flex;
    gap: 10px;
  }
  
  .img {
    width: 50px;
    height: 50px;
    font-size: 20px;
    font-weight: 700;
    border: 1px solid #58a6ff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    color: #58a6ff;
  }
  
  .name {
    font-size: 15px;
    font-weight: 700;
    color: #58a6ff;
  }
  
  .details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: #fff;
    justify-content: center;
  }
  
  .username {
    font-size: 12px;
    color: #999;
  }
  
  .about {
    color: #ccc;
    padding-top: 10px;
    font-size: 13px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 10px;
  }
`;

export default GitHubTooltip;


        // Create floating elements
        document.addEventListener('DOMContentLoaded', function() {
            const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9ff3', '#feca57'];
            const shapes = ['circle', 'square', 'triangle'];
            
            for (let i = 0; i < 15; i++) {
                createFloatingElement();
            }
            
            function createFloatingElement() {
                const element = document.createElement('div');
                element.classList.add('floating');
                
                // Random properties
                const size = Math.random() * 50 + 20;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const duration = Math.random() * 20 + 10;
                const delay = Math.random() * 5;
                
                // Position
                element.style.left = `${left}%`;
                element.style.top = `${top}%`;
                element.style.width = `${size}px`;
                element.style.height = `${size}px`;
                element.style.animationDuration = `${duration}s`;
                element.style.animationDelay = `-${delay}s`;
                
                // Shape styling
                if (shape === 'circle') {
                    element.style.borderRadius = '50%';
                } else if (shape === 'square') {
                    element.style.borderRadius = '5px';
                } else if (shape === 'triangle') {
                    element.style.width = '0';
                    element.style.height = '0';
                    element.style.borderLeft = `${size/2}px solid transparent`;
                    element.style.borderRight = `${size/2}px solid transparent`;
                    element.style.borderBottom = `${size}px solid ${color}`;
                    element.style.backgroundColor = 'transparent';
                }
                
                if (shape !== 'triangle') {
                    element.style.backgroundColor = color;
                }
                
                // Random movement
                const keyframes = `
                    @keyframes float-${Math.floor(Math.random() * 1000)} {
                        0%, 100% {
                            transform: translate(0, 0) rotate(0deg);
                        }
                        25% {
                            transform: translate(${Math.random() * 50 - 25}px, ${Math.random() * 50 - 25}px) rotate(${Math.random() * 360}deg);
                        }
                        50% {
                            transform: translate(${Math.random() * 50 - 25}px, ${Math.random() * 50 - 25}px) rotate(${Math.random() * 360}deg);
                        }
                        75% {
                            transform: translate(${Math.random() * 50 - 25}px, ${Math.random() * 50 - 25}px) rotate(${Math.random() * 360}deg);
                        }
                    }
                `;
                
                const style = document.createElement('style');
                style.innerHTML = keyframes;
                document.head.appendChild(style);
                
                element.style.animationName = `float-${Math.floor(Math.random() * 1000)}`;
                
                document.body.appendChild(element);
            }
        });
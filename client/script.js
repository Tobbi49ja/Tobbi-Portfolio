// script.js
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

mobileMenuBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('active');
});

const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
mobileNavLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    setActiveNavLink();
  });
});

function setActiveNavLink() {
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  let currentPath = window.location.pathname;

  if (currentPath === '' || currentPath === '/') {
    currentPath = '/';
  } else {
    currentPath = currentPath.replace(/\/$/, '');
  }

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    const normalizedHref = href.replace(/\/$/, '');

    if (normalizedHref === currentPath || 
        (currentPath === '' && normalizedHref === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

const backToTopBtn = document.querySelector('.back-to-top');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add('active');
  } else {
    backToTopBtn.classList.remove('active');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Animation for elements
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Target elements for animation
  const elements = document.querySelectorAll(
    '.section, .section-title, .logo, .nav-link, .mobile-nav-link, .hero-title, .hero-subtitle, .hero-buttons .btn, .floating-arrow, .about-img, .about-title, .about-text, .about-buttons .btn, .skills-category, .skills-category-title, .skill-item, .project-card, .project-title, .project-description, .tag, .project-link, .projects-more .btn, .contact-info-title, .contact-info-text, .contact-detail, .social-icon, .form-group, .footer-logo, .footer-social-icon, .footer-link, .footer-copyright, .project-preview-img, .project-preview-title, .project-preview-description, .project-preview-tags .tag, .project-preview-subtitle, .project-preview-writeup, .project-preview-buttons .btn, .back-link'
  );
  elements.forEach(element => observer.observe(element));

  // Dynamic project preview page logic
  if (window.location.pathname.includes('project-preview.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    const project = projects.find(p => p.id === projectId);

    if (project) {
      // Update page title
      document.title = `${project.title} Preview - Tobbi`;

      // Populate project details
      document.getElementById('project-title').textContent = project.title;
      document.getElementById('project-description').textContent = project.shortDescription;
      document.getElementById('project-writeup').textContent = project.writeup;
      const projectImage = document.getElementById('project-image');
      projectImage.src = project.image;
      projectImage.alt = project.title;

      // Populate tags
      const tagsContainer = document.getElementById('project-tags');
      project.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.classList.add('tag');
        tagElement.textContent = tag;

        // Assign tag color based on technology
        const tagClasses = {
          'HTML5': 'tag-blue',
          'CSS': 'tag-purple',
          'JavaScript': 'tag-green',
          'Express.js': 'tag-red',
          'React Native': 'tag-blue',
          'Node.js': 'tag-indigo',
          'MongoDB': 'tag-green',
          'Python': 'tag-orange',
          'Django': 'tag-teal',
          'React Native & Vite': 'tag-blue',
          'Express': 'tag-yellow'
        };
        tagElement.classList.add(tagClasses[tag] || 'tag-blue');
        tagsContainer.appendChild(tagElement);
      });

      // Populate buttons
      const liveDemoBtn = document.getElementById('live-demo');
      const repoLinkBtn = document.getElementById('repo-link');
      liveDemoBtn.href = project.liveDemoUrl || '#';
      repoLinkBtn.href = project.repoUrl;

      // Hide live demo button if no URL is provided
      if (!project.liveDemoUrl) {
        liveDemoBtn.style.display = 'none';
      }
    } else {
      // Handle case where project is not found
      document.querySelector('.project-preview-container').innerHTML = `
        <h2 class="project-preview-title">Project Not Found</h2>
        <p class="project-preview-description">The requested project could not be found. Please return to the projects page.</p>
      `;
    }
  }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth'
      });
      window.history.pushState(null, null, targetId);
      setActiveNavLink();
    }
  });
});

function animateOnScroll() {
  const elements = document.querySelectorAll(
    '.section, .section-title, .logo, .nav-link, .mobile-nav-link, .hero-title, .hero-subtitle, .hero-buttons .btn, .floating-arrow, .about-img, .about-title, .about-text, .about-buttons .btn, .skills-category, .skills-category-title, .skill-item, .project-card, .project-title, .project-description, .tag, .project-link, .projects-more .btn, .contact-info-title, .contact-info-text, .contact-detail, .social-icon, .form-group, .footer-logo, .footer-social-icon, .footer-link, .footer-copyright'
  );
  
  elements.forEach((element, index) => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        element.classList.add('visible');
        observer.unobserve(element);
      }
    }, { threshold: 0.1 });
    
    observer.observe(element);
  });
}

const skillBars = document.querySelectorAll('.skill-progress');

function animateSkillBars() {
  skillBars.forEach(bar => {
    const width = bar.style.width;
    bar.style.width = '0';
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        bar.style.width = width;
        observer.unobserve(bar.parentElement);
      }
    });
    
    observer.observe(bar.parentElement);
  });
}

// Contact form submission
const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Message sent successfully!');
        contactForm.reset();
      } else {
        alert(result.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    }
  });
}

window.addEventListener('load', () => {
  animateSkillBars();
  animateOnScroll();
  setActiveNavLink();
});

// Update active link on navigation
document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    setActiveNavLink();
  });
});

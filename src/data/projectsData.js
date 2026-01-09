export const projectsData = [
  {
    id: 'cisl-inference-pipeline',
    title: 'Real-Time Hyperspectral Inference Pipeline',
    subtitle: 'Beckman Institute - CISL Lab',
    shortDescription: 'High-performance deep learning inference system achieving 47% speedup through TensorRT FP16 optimization. Processes hyperspectral tissue imaging data with ResNet50-CBAM attention model via mapped network drives.',
    color: 'purple',
    featured: true,
    hasDetails: true,
    links: [
      { label: 'Project Poster', url: '/src/images/Poster.pdf' }
    ],
    tags: ['PyTorch', 'TensorRT', 'ResNet50', 'CBAM Attention', 'CUDA', 'ONNX Runtime'],
    highlights: [
      'Designed complete inference pipeline from scratch for hyperspectral image processing',
      'Validated across 202 real tissue samples: 83.47s → 44.16s inference, 136.23s → 97.17s total pipeline',
      'Deployed production system enabling seamless local processing workflows at CISL Beckman Institute'
    ],
    overview: [
      'Designed and developed a high-performance deep learning inference pipeline for processing hyperspectral tissue imaging data using a custom ResNet50-based attention generator model (CBAM).',
      'Implemented multiple optimization strategies including PyTorch native, ONNX Runtime, and TensorRT FP16, achieving 47% inference speedup and 29% total pipeline improvement over baseline (validated across 202 samples).',
      'Deployed using mapped network drives for seamless local processing, enabling efficient workflows for tissue imaging analysis at CISL lab.'
    ],
    timeline: [
      {
        title: 'Phase 1: Initial Inference Server',
        videoUrl: 'https://www.youtube.com/embed/Ur-iXn4yEwg',
        description: 'Created the first iteration of the inference server with manual processing capabilities and detailed performance metrics.',
        features: [
          'Upload BSQ hyperspectral image pairs (10 spectral bands, 2.0 µm/pixel)',
          'ResNet50 backbone with CBAM attention mechanisms',
          'Generate 3-channel RGB reconstruction at 0.69 µm/pixel resolution',
          'Run inference on selected regions',
          'Patch-based processing: 1024×1024 patches, batch size 4',
          'Detailed timing metrics (BSQ load, inference, write times)'
        ],
        technologies: ['PyTorch', 'ResNet50', 'CBAM', 'CUDA', 'Spectral Library'],
        limitations: [
          'Manual file upload process',
          'No optimization strategies implemented yet'
        ]
      },
      {
        title: 'Phase 2: Enhanced Streaming GUI',
        videoUrl: 'https://www.youtube.com/embed/V6QrnFpiEwM',
        description: 'Built comprehensive Tkinter GUI for streaming workflow with intelligent file management and retry logic, enabling real-time data transfer from instrument to inference pipeline.',
        features: [
          'Unified Tkinter application combining sender and receiver terminals',
          'Filtered send: validates and sends only complete BSQ pairs',
          'Intelligent retry logic for failed transmissions (max 3 attempts)',
          'Visual processing queue with real-time status indicators',
          'File validation to prevent sending incomplete or corrupted data',
          'Status monitoring for both instrument and processing workflows',
          'Socket optimizations: 512MB buffers, keep-alive connections',
          'TCP socket server with multi-threaded client handling'
        ],
        technologies: ['Tkinter', 'Python Multithreading', 'TCP/IP Sockets', 'File System Monitoring', 'Socket Programming']
      },
      {
        title: 'Phase 3: Online Platform (Work in Progress)',
        description: 'Developing web-based platform enabling researchers to remotely access internal network drives and select folders for inference processing without manual data transfer.',
        features: [
          'Web interface for browsing mapped network drives',
          'Folder selection for batch inference processing',
          'Remote access to internal CISL infrastructure',
          'Queue management for multiple researcher requests',
          'Authentication and authorization for secure access',
          'Real-time processing status updates',
          'Integration with existing inference pipeline'
        ],
        technologies: ['Flask', 'Network File System', 'Authentication', 'Queue Management', 'WebSockets'],
        limitations: [
          'Currently in development phase',
          'Security considerations for remote network access'
        ]
      }
    ],
    architectureSections: [
      {
        title: 'Project Lifecycle Overview',
        content: 'Complete clinical workflow from tissue sample acquisition through imaging, staining, diagnosis, and back to the operating table - a closed-loop system for intraoperative pathology.',
        subsections: [
          {
            title: 'End-to-End Clinical Pipeline',
            content: 'Circular workflow diagram showing: tissue section sliced from patient sample → mounted on slide → hyperspectral imaging by instrument → deep learning inference → H&E staining → web viewer visualization → pathologist diagnosis → results back to operating room for surgical decision-making.',
            images: [
              { src: '/src/images/Flow.png', alt: 'End-to-End Clinical Pipeline', caption: 'Closed-loop clinical workflow: patient tissue → slide preparation → hyperspectral imaging → TensorRT inference → web viewer diagnosis → surgical guidance' }
            ]
          }
        ]
      },
      {
        title: 'Performance Benchmarking Results',
        content: 'Rigorous testing across 202 samples revealed significant performance improvements through TensorRT FP16 optimization, with measurable speedups in inference time and total pipeline execution.',
        subsections: [
          {
            title: 'Optimization Strategy Comparison (202 Samples)',
            content: 'Comprehensive performance analysis showing 47% inference speedup (83.47s → 44.16s) and 29% total pipeline improvement (136.23s → 97.17s) with TensorRT FP16 over PyTorch baseline.',
            images: [
              { src: '/src/images/inference_time_boxplot.png', alt: 'Inference Time Comparison', caption: 'Inference time improvement: PyTorch baseline (83.47s average) → TensorRT FP16 (44.16s average, 47% speedup) across 202 samples' },
              { src: '/src/images/load_time_boxplot.png', alt: 'Data Loading Time Analysis', caption: 'BSQ/HDR hyperspectral data loading performance showing consistency across optimization strategies (202 sample average)' },
              { src: '/src/images/write_time_boxplot.png', alt: 'Output Write Time Comparison', caption: 'Output generation timing demonstrating consistent performance across all strategies (202 sample average)' },
              { src: '/src/images/time_breakdown_comparison.png', alt: 'End-to-End Pipeline Breakdown', caption: 'Complete pipeline analysis: Total time improved from 136.23s (baseline) to 97.17s (TensorRT FP16, 29% improvement) across 202 samples' }
            ]
          }
        ]
      },
      {
        title: 'Model Architecture',
        subsections: [
          {
            title: 'ResNet50 with CBAM Attention',
            points: [
              'Base Architecture: ResNet50 backbone with custom attention modules',
              'Input: Model Type 0 (IR-only): 10 spectral bands | Model Type 1 (IR+VIS): 13 channels (10 IR + 3 RGB)',
              'Output: 3-channel RGB reconstruction at 0.69 µm/pixel resolution',
              'Channel Attention: Squeeze-and-excitation style recalibration',
              'Spatial Attention: Spatial feature refinement using pooling',
              'Combined CBAM: Channel and spatial attention in sequence'
            ]
          },
          {
            title: 'Data Processing Pipeline',
            points: [
              'DAT/HDR loading with spectral library',
              'IR Preprocessing: Extract 10 bands, normalize to [-1, 1]',
              'Spatial scaling: 2.0 µm/pixel IR → 0.69 µm/pixel output (factor: 0.345)',
              'VIS Preprocessing: RGB TIFF or DAT/HDR with intelligent scaling, bilinear interpolation',
              'Patch-based: 1024×1024 patches, batch size 4, non-overlapping'
            ]
          }
        ]
      },
      {
        title: 'Optimization Strategies',
        subsections: [
          {
            title: 'PyTorch Native (Baseline)',
            points: [
              'Automatic Mixed Precision (AMP) with torch.cuda.amp.autocast()',
              'Gradient disabled: torch.set_grad_enabled(False)',
              'Model in evaluation mode',
              'Baseline performance: 83.47s inference time, 136.23s total pipeline (202 sample average)',
              'GPU memory: ~2GB for batch_size=4'
            ]
          },
          {
            title: 'ONNX Runtime',
            points: [
              'Export: torch.onnx.export() with dynamic axes',
              'Execution: CUDAExecutionProvider, CPUExecutionProvider fallback',
              'Graph optimizations: ORT_ENABLE_ALL',
              'Benefits: Cross-platform deployment, operator fusion',
              'Performance: Similar to PyTorch, focus on portability'
            ]
          },
          {
            title: 'TensorRT FP16 (Best Performance)',
            points: [
              '47% inference speedup: 83.47s → 44.16s (202 sample average)',
              '29% total pipeline improvement: 136.23s → 97.17s',
              'Layer fusion: conv + batch norm + ReLU',
              'Kernel auto-tuning for specific GPU architecture',
              'Dynamic tensor memory allocation',
              'Warmup: 10 iterations with dummy data (~5s)',
              'Minimal accuracy loss with half precision'
            ]
          }
        ]
      },
      {
        title: 'Real-Time Streaming Architecture',
        subsections: [
          {
            title: 'TCP Socket Server',
            points: [
              'Port 8080 with multi-threaded client handling',
              'Protocol: Metadata packet → IR chunks (64MB) → VIS data → Result',
              'Socket optimizations: 512MB buffers, TCP_NODELAY, keep-alive',
              'Pre-allocated tensors to avoid repeated allocations'
            ]
          },
          {
            title: 'Inference Queue System',
            points: [
              'FIFO queue for multiple client requests',
              'Single worker thread prevents GPU contention',
              'Clients wait using threading events',
              'Queue position tracking for feedback'
            ]
          }
        ]
      },
    ],
    impact: {
      achievements: [
        '47% Inference Speedup using TensorRT FP16 (83.47s → 44.16s, validated across 202 samples)',
        '29% Total Pipeline Improvement (136.23s → 97.17s)',
        'Comprehensive Benchmarking across PyTorch, ONNX, and TensorRT strategies',
        'Complete Pipeline Ownership from data loading to result generation',
        'Production Deployment processing 900+ tissue samples via mapped network drives'
      ],
      metrics: [
        { value: '47%', label: 'Inference Speedup (202 samples)' },
        { value: '44.16s', label: 'Optimized Inference Time' },
        { value: '29%', label: 'Total Pipeline Improvement' }
      ]
    },
    technologies: [
      'PyTorch',
      'TensorRT',
      'ONNX Runtime',
      'ResNet50',
      'CBAM Attention',
      'CUDA',
      'Spectral Library',
      'NumPy',
      'Patch-based Processing',
      'Mixed Precision (AMP)',
      'Kernel Optimization'
    ]
  },
  {
    id: 'cisl-web-viewer',
    title: 'Tissue Imaging Web Viewer Platform',
    subtitle: 'Beckman Institute - CISL Lab',
    shortDescription: 'Flask web platform for viewing 40K×40K pixel tissue images using OpenSeadragon deep zoom with freehand annotations, automated sample database, and QR-based tracking system.',
    color: 'blue',
    featured: true,
    hasDetails: true,
    links: [
      { label: 'Live Platform', url: 'https://cisl-inference.beckman.illinois.edu/' },
      { label: 'Project Poster', url: '/src/images/Poster.pdf' }
    ],
    tags: ['Flask', 'OpenSeadragon', 'Annotorious', 'SQLAlchemy', 'Nginx', 'Gunicorn', 'libvips'],
    highlights: [
      'Achieved 10x faster tile generation through SZI format optimization after consulting with libvips author',
      'Implemented dynamic pixel-accurate scale bars adapting to zoom level and micron-per-pixel metadata',
      'Designed automated sample ingestion pipeline with SQLAlchemy ORM and Zebra printer QR integration'
    ],
    overview: [
      'Built a comprehensive Flask-based web application with OpenSeadragon for seamless real-time viewing of high-resolution tissue images (40K×40K pixels), featuring smooth pan/zoom with multi-resolution pyramids. Achieved 10x faster file creation through SZI format optimization after consulting with libvips author.',
      'Developed advanced annotation system with freehand drawing, color/width persistence, tag classification, and JSON export/import for research collaboration. Deployed as production system serving researchers at Beckman Institute with zero downtime using Gunicorn graceful restart.',
      'Implemented complete sample database management with automated folder monitoring, metadata extraction, QR code tracking, and Zebra printer integration. Owned full project lifecycle from architecture design through development, deployment, and ongoing maintenance with cross-platform compatibility for desktop and mobile devices.'
    ],
    timeline: [
      {
        title: 'Phase 1: Deep Zoom Image Integration & SZI Format',
        description: 'Researched and integrated industry-standard deep zoom formats, achieving 10x faster file creation with SZI optimization.',
        features: [
          'Discovered Zoomify format used by professional tissue imaging sites (tissuearray.com)',
          'Evaluated Deep Zoom Image (DZI) and OpenSeadragon alternatives',
          'Consulted with libvips author (jcupitt) on GitHub for optimization advice',
          'Learned about SZI format (zipped DZI) to solve Windows file creation bottleneck',
          'Switched to vips format for intermediate image storage using pyvips',
          'Optimized tile size to 1024×1024 pixels for better performance',
          'Reduced pyramid levels by adjusting zoom-out resolution',
          'Achieved 10x faster file creation vs individual tile writing',
          'Single-file distribution simplified deployment and management'
        ],
        technologies: ['libvips', 'pyvips', 'SZI Format', 'DZI', 'OpenSeadragon', 'GitHub Collaboration']
      },
      {
        title: 'Phase 2: Image Serving Optimization',
        videoUrl: 'https://www.youtube.com/embed/hSL2eyppQmY',
        description: 'Experimented with delivery strategies to optimize browser loading performance after SZI format implementation.',
        features: [
          'Comparison: Full archive download vs HTTP range requests',
          'Full download: download entire SZI, unzip in browser, extract tiles (large initial load)',
          'Range requests: request only needed tiles on-demand (many small requests)',
          'Performance analysis revealed range requests slower than expected',
          'Final solution: Optimized SZI generation settings eliminated need for range requests',
          'Proper tile sizing (1024×1024) and pyramid levels provided fast loading',
          'Result: Simple static file serving with excellent performance',
          'Caching headers: 2-hour DZI, 1-hour tiles'
        ],
        technologies: ['HTTP Range Requests', 'Browser File API', 'Performance Profiling', 'Nginx Caching']
      },
      {
        title: 'Phase 3: Branding & Accessibility',
        description: 'Applied University of Illinois branding and ensured accessibility standards before building advanced features.',
        features: [
          'University of Illinois color scheme (orange and blue)',
          'Official logo and wordmark integration',
          'Consistent typography using university font stack',
          'ARIA labels for screen reader accessibility',
          'Keyboard navigation support throughout application',
          'High contrast color schemes for visibility',
          'Focus indicators for keyboard users',
          'Mobile-optimized touch controls'
        ],
        technologies: ['CSS Custom Properties', 'ARIA', 'Accessibility Best Practices', 'Responsive Design']
      },
      {
        title: 'Phase 4: Navigation & User Experience',
        description: 'Enhanced platform with comprehensive navigation, search, and responsive UI for optimal user experience.',
        features: [
          'Pagination system for large collections (6, 12, 24, 48, or All per page)',
          'Real-time search filtering by sample ID (client-side, <50ms)',
          'Collapsible sidebar with thumbnails for quick navigation',
          'URL state management for bookmarkable, shareable links',
          'Browser back/forward navigation support',
          'Synchronized highlighting between grid and sidebar',
          'Responsive design optimized for mobile and desktop'
        ],
        technologies: ['React Router', 'URL Parameters', 'CSS Grid', 'Responsive Design', 'Local Storage']
      },
      {
        title: 'Phase 5: Advanced Research Features',
        description: 'Built comprehensive annotation system, scale bar measurements, and screenshot capabilities for diagnostic markup and research collaboration.',
        features: [
          'Integrated Annotorious 2 with OpenSeadragon for freehand tissue region markup',
          'Color and width persistence: each annotation stores custom stroke styling',
          'Tag system for annotation classification (Cancer/Normal/etc.)',
          'JSON export/import for sharing annotations between researchers',
          'Dynamic scale bar with accurate physical measurements (0.69 µm/pixel)',
          'Automatic unit selection (nanometers, micrometers, millimeters)',
          'Screenshot capture with annotations and scale bar embedded',
          'Zoom-responsive rendering maintains clarity at all scales'
        ],
        technologies: ['Annotorious 2', 'SVG', 'Web Annotation Standard', 'Canvas API', 'html2canvas']
      },
      {
        title: 'Phase 6: Real-Time Data Streaming (Optional Architecture)',
        videoUrl: 'https://www.youtube.com/embed/t0KslGpLqAA',
        description: 'Developed TCP socket streaming architecture for real-time data transfer from instrument to viewer, enabling continuous acquisition workflows as an alternative to mapped drives.',
        features: [
          'Sender script monitors acquisition directory on instrument computer',
          'Automatic streaming of BSQ data over TCP sockets (64MB chunks)',
          'Receiver queues incoming data for processing',
          'FIFO queue with single worker thread to prevent contention',
          'Full-loop demonstration from data reception to result visualization'
        ],
        technologies: ['Python Sockets', 'TCP/IP', 'Threading', 'Queue Management', 'TCP_NODELAY'],
        limitations: [
          'More complex than mapped drive approach',
          'Requires network configuration and port management'
        ]
      },
      {
        title: 'Phase 7: Enhanced Streaming GUI',
        videoUrl: 'https://www.youtube.com/embed/V6QrnFpiEwM',
        description: 'Built comprehensive Tkinter GUI for streaming workflow with intelligent file management and retry logic.',
        features: [
          'Unified Tkinter application combining sender and receiver terminals',
          'Filtered send: validates and sends only complete BSQ pairs',
          'Intelligent retry logic for failed transmissions (max 3 attempts)',
          'Visual processing queue with real-time status indicators',
          'File validation to prevent sending incomplete or corrupted data',
          'Status monitoring for both instrument and processing workflows',
          'Socket optimizations: 512MB buffers, keep-alive connections'
        ],
        technologies: ['Tkinter', 'Python Multithreading', 'File System Monitoring', 'Socket Programming']
      }
    ],
    architectureSections: [
      {
        title: 'Project Lifecycle Overview',
        content: 'Complete clinical workflow from tissue sample acquisition through imaging, staining, diagnosis, and back to the operating table - a closed-loop system for intraoperative pathology.',
        subsections: [
          {
            title: 'End-to-End Clinical Pipeline',
            content: 'Circular workflow diagram showing: tissue section sliced from patient sample → mounted on slide → hyperspectral imaging by instrument → deep learning inference → H&E staining → web viewer visualization with annotations → pathologist diagnosis → results back to operating room for surgical decision-making.',
            images: [
              { src: '/src/images/Flow.png', alt: 'End-to-End Clinical Pipeline', caption: 'Closed-loop clinical workflow: patient tissue → slide preparation → hyperspectral imaging → TensorRT inference → web viewer diagnosis → surgical guidance' }
            ]
          }
        ]
      },
      {
        title: 'Frontend Architecture',
        subsections: [
          {
            title: 'OpenSeadragon Deep Zoom Viewer',
            points: [
              'Multi-resolution pyramid tile loading with GPU-accelerated rendering',
              'Mobile optimizations: reduced cache (60 vs 1000 images), disabled flick navigation',
              'Touch gesture configuration for pinch-to-zoom',
              'Dynamic tile requests from ZIP archives via server endpoint',
              'Caching headers: 2-hour DZI descriptors, 1-hour image tiles',
              'Lazy loading: tiles load only when scrolled into view'
            ]
          },
          {
            title: 'Annotation System (Annotorious 2)',
            points: [
              'Freehand drawing tool integrated with OpenSeadragon',
              'Custom formatting: stores geometry, style (color/width), tags, metadata',
              'Dynamic CSS generation for each unique color/width combination',
              'Save/Load as JSON following W3C Web Annotation standard',
              'Zoom-responsive redrawing at significant zoom changes',
              'Pan/Draw mode switching with floating controls'
            ]
          },
          {
            title: 'User Interface Components',
            points: [
              'Floating controls: tool switching, color picker, width slider',
              'Homepage grid: responsive CSS Grid with thumbnail preloading',
              'Pagination controls with smart page number display',
              'Search functionality: real-time filtering with URL sync',
              'Sidebar: collapsible thumbnail navigation',
              'Scale bar: dynamic with automatic unit selection'
            ]
          }
        ]
      },
      {
        title: 'Backend Architecture',
        subsections: [
          {
            title: 'Flask WSGI Application',
            points: [
              'Flask-Login: Session management with PBKDF2-SHA256 hashing (200k iterations)',
              'Flask-SQLAlchemy: Database ORM for sample and user management',
              'Flask-CORS: Cross-origin resource sharing for API endpoints',
              'Flask-Compress: Gzip compression for text responses',
              'Flask-Migrate: Database schema migrations'
            ]
          },
          {
            title: 'Database Schema (SQLite)',
            points: [
              'Users table: id, username, password_hash, role (user/admin)',
              'Tissue_Images table: sample_id, filename, directory, organ, species, condition',
              'Metadata fields: procedure, block, image_type, spectrum_type, dimensions',
              'Indexing on sample_id, image_type for fast queries (<10ms)',
              'Automated folder monitoring with watchdog library',
              'Duplicate prevention: check existing by sample_id + image_type'
            ]
          },
          {
            title: 'Deployment Stack',
            points: [
              'Nginx reverse proxy: HTTPS, gzip compression, static file caching',
              'Gunicorn: 4 workers (2×CPU cores), Unix socket binding',
              'Let\'s Encrypt SSL: Auto-renewal with certbot',
              'Service management: systemd viewer.service',
              'Zero-downtime: Gunicorn graceful restart on deployment'
            ]
          }
        ]
      },
      {
        title: 'Optional: Real-Time Streaming Architecture',
        content: 'Alternative deployment mode using TCP sockets for real-time data transfer (lab uses mapped drives as primary method).',
        subsections: [
          {
            title: 'TCP Socket Server',
            points: [
              'Port 8080 with multi-threaded client handling',
              'Protocol: Metadata packet → Data chunks (64MB) → Result',
              'Socket optimizations: 512MB buffers, TCP_NODELAY, keep-alive',
              'Pre-allocated buffers to avoid repeated allocations'
            ]
          },
          {
            title: 'Processing Queue System',
            points: [
              'FIFO queue for multiple client requests',
              'Single worker thread prevents resource contention',
              'Clients wait using threading events',
              'Queue position tracking for feedback'
            ]
          },
          {
            title: 'Deployment Flexibility',
            points: [
              'Primary mode: Mapped network drives (simpler, used at CISL)',
              'Alternative mode: TCP streaming (for remote deployments)',
              'Framework supports both without code changes',
              'Lab preference for mapped drives due to simplicity'
            ]
          }
        ]
      },
      {
        title: 'Sample Management System',
        subsections: [
          {
            title: 'Automated Folder Monitoring',
            points: [
              'Watches archive directory for new samples with watchdog',
              'Metadata extraction from directory structure and ENVI headers',
              'Path-based parsing: /archive/Organ/Procedure/Date/SampleID',
              'Duplicate prevention before database insertion',
              'Supports BSQ/HDR (IR), TIFF (VIS), and H&E slides'
            ]
          },
          {
            title: 'QR Code & Physical Tracking',
            points: [
              'QR code generation for each sample (qrcode library)',
              'Encodes direct link: https://cisl-inference.beckman.illinois.edu/?image=SampleID',
              'Zebra printer integration with ZPL (Zebra Programming Language)',
              'Label layout: QR code (left) + Sample ID (right, large text)',
              '266×266 pixel label optimized for Zebra printers',
              'Bulk printing: select multiple samples, generate ZPL batch'
            ]
          },
          {
            title: 'Database Web Interface',
            points: [
              'Table view: sortable columns, pagination',
              'Search/filter: by sample ID, organ, procedure, date',
              'Inline editing: update metadata fields',
              'Bulk actions: select multiple samples for operations',
              'Export functionality: CSV format for analysis',
              'Admin-only access with role-based control'
            ]
          }
        ]
      },
    ],
    keyFeatures: [
      {
        title: 'High-Resolution Viewer',
        description: 'OpenSeadragon-based viewer with smooth pan/zoom for 40K×40K pixel images using multi-resolution pyramids and GPU-accelerated rendering.'
      },
      {
        title: 'Advanced Annotations',
        description: 'Freehand drawing with color/width persistence, tag classification, JSON export/import, and zoom-responsive rendering for research collaboration.'
      },
      {
        title: 'Dynamic Scale Bar',
        description: 'Accurate physical measurements with automatic unit selection (nm/µm/mm) that updates on pan/zoom using image metadata.'
      },
      {
        title: 'Screenshot Capture',
        description: 'Save current viewport with annotations and scale bar embedded as PNG for documentation and presentations.'
      },
      {
        title: 'Sample Database',
        description: 'Automated folder monitoring, metadata extraction, search/filter, QR code tracking, and Zebra printer integration for physical organization.'
      },
      {
        title: 'User Authentication',
        description: 'Role-based access control (user/admin), secure password hashing (PBKDF2-SHA256), HTTP-only cookies, and session management.'
      },
      {
        title: 'Navigation System',
        description: 'Pagination, sidebar thumbnails, real-time search, URL state management for bookmarkable links, and responsive design.'
      },
      {
        title: 'CI/CD & Deployment',
        description: 'Nginx reverse proxy with HTTPS, Gunicorn WSGI server, Let\'s Encrypt SSL auto-renewal, and Git-based deployment with zero downtime.'
      }
    ],
    technologies: [
      'Flask',
      'SQLAlchemy',
      'OpenSeadragon',
      'Annotorious 2',
      'libvips',
      'pyvips',
      'Gunicorn',
      'Nginx',
      'Let\'s Encrypt',
      'SQLite',
      'HTML5 Canvas',
      'SVG',
      'CSS Grid',
      'Responsive Design',
      'QR Codes',
      'Zebra Printing (ZPL)',
      'Watchdog',
      'Flask-Login',
      'PBKDF2-SHA256',
      'Git',
      'Linux',
      'JavaScript',
      'html2canvas'
    ]
  },
  {
    id: 'golfbud',
    title: 'GolfBud',
    subtitle: 'Full-Stack Golf Course Management Platform (Team fa25-team003)',
    shortDescription: 'Comprehensive golf course yardage and scoring platform eliminating paywalls to provide free access to detailed course maps and data for golfers across the United States.',
    color: 'green',
    hasDetails: true,
    links: [
      { label: 'GitHub Repository', url: 'https://github.com/CS222-UIUC/fa25-team003' }
    ],
    tags: ['Next.js 15', 'React 19', 'TypeScript', 'Firebase', 'Tailwind CSS 4', 'Cloud Firestore'],
    highlights: [
      'Agile development with iterative sprints, mentor feedback, and milestone-driven deadlines',
      'Collaborative team development using GitHub for version control and pull request workflow',
      'Full SDLC experience through MVP development with core functionality'
    ],
    overview: [
      'GolfBud is a comprehensive golf course management platform developed as a collaborative team project (fa25-team003) following Agile methodology with iterative sprints and milestone-driven deadlines. The project progressed through complete SDLC stages from requirements gathering and design to MVP development with core authentication, course browsing, and rounds tracking functionality.',
      'Built with Next.js 15 and React 19, the platform leverages modern web technologies to deliver a fast, responsive experience with server-side rendering and client-side interactivity. Development followed Agile practices with regular mentor feedback sessions, sprint planning, and iterative improvements based on feedback. Team collaboration was managed through GitHub with feature branches, pull requests, and code reviews to maintain code quality.',
      'The application integrates Firebase for authentication and real-time data management, featuring a complete rounds tracking system with CRUD operations, PDF yardage map downloads, and comprehensive course management capabilities. Project successfully delivered MVP with essential features through multiple sprint cycles, meeting deadlines and incorporating stakeholder feedback at each iteration.'
    ],
    keyFeatures: [
      {
        title: 'Authentication & User Management',
        description: 'Firebase Authentication with Google Sign-In, server-side session verification, protected routes, and user-specific data isolation for secure access control.'
      },
      {
        title: 'Course Management System',
        description: 'Browse and search golf courses with dynamic course detail pages, JSON-based score data storage, and responsive listing interface.'
      },
      {
        title: 'PDF Yardage Map Feature',
        description: 'Frontend-based PDF download system with existence verification, sanitized filename generation, and static file serving from yardage directory.'
      },
      {
        title: 'Rounds Tracking System',
        description: 'Full CRUD operations for golf rounds using Cloud Firestore with real-time synchronization, user-specific history, pagination, and edit/delete functionality.'
      },
      {
        title: 'Responsive UI/UX',
        description: 'Modern gradient design with green/emerald/teal color scheme, sticky header navigation with backdrop blur, mobile-responsive layout, and icon integration.'
      }
    ],
    architectureSections: [
      {
        title: 'Platform Overview',
        subsections: [
          {
            title: 'Landing Page & Course Discovery',
            content: 'Modern, responsive landing page featuring course browsing, search functionality, and seamless navigation to detailed course information.',
            images: [
              { src: '/src/images/Golfbud1.png', alt: 'GolfBud Landing Page', caption: 'GolfBud landing page showcasing course listings, search interface, and modern gradient design system' }
            ]
          }
        ]
      },
      {
        title: 'Frontend Architecture',
        subsections: [
          {
            title: 'Next.js 15 App Router',
            points: [
              'Server Components and Client Components for optimal performance',
              'Route-based file structure with protected routes ((authed))',
              'Server-side rendering for SEO and initial load performance',
              'API routes for session management (/api/session, /api/courses)'
            ]
          },
          {
            title: 'React 19 Patterns',
            points: [
              'Modern hooks and state management',
              'Component composition for reusability',
              'Modular architecture with components directory',
              'TypeScript for type safety and developer experience'
            ]
          },
          {
            title: 'Styling System',
            points: [
              'Tailwind CSS 4 for utility-first styling',
              'Custom gradient design system (green/emerald/teal)',
              'Responsive design with mobile-first approach',
              'Icon libraries: Lucide React and React Icons'
            ]
          }
        ]
      },
      {
        title: 'Backend & Database',
        subsections: [
          {
            title: 'Firebase Integration',
            points: [
              'firebase.ts: Client-side Firebase SDK integration',
              'firebaseAdmin.ts: Server-side authentication verification',
              'Cloud Firestore for real-time data storage',
              'Firebase Authentication with Google Sign-In provider'
            ]
          },
          {
            title: 'Rounds Tracking & User History',
            content: 'Full-featured rounds management system with real-time Firestore synchronization, user-specific data isolation, and comprehensive CRUD operations for tracking golf rounds.',
            points: [
              'Real-time data synchronization with Cloud Firestore',
              'User-specific rounds history with pagination',
              'Edit and delete functionality for round management',
              'Course association with detailed scoring data'
            ],
            images: [
              { src: '/src/images/Golfbud2.png', alt: 'GolfBud Rounds Page', caption: 'Rounds tracking page displaying user golf round history with CRUD operations and Firestore real-time synchronization' }
            ]
          },
          {
            title: 'Data Management',
            points: [
              'courseUtils.ts: Course data handling utilities',
              'pdfUtils.ts: PDF download and management',
              'JSON-based score data storage (Atkins Golf Course, PGA National Resort)',
              'Static file serving from public directory'
            ]
          },
          {
            title: 'API Design',
            points: [
              'RESTful API routes for course and session management',
              'Server-side session verification for security',
              'Protected API endpoints with authentication middleware',
              'Real-time data synchronization with Firestore'
            ]
          }
        ]
      },
      {
        title: 'Agile Development & Team Collaboration',
        content: 'Developed as part of a collaborative team project (fa25-team003) following Agile methodology with iterative sprints, regular mentor feedback sessions, and milestone-driven deadlines. Progressed through complete SDLC stages from requirements and design to MVP development with core functionality.',
        points: [
          'Followed Agile methodology with sprint planning, daily standups, and retrospectives',
          'Participated in iterative development cycles with regular mentor feedback and guidance',
          'Met milestone deadlines throughout SDLC: requirements, design, implementation, testing',
          'Developed MVP with core authentication, course browsing, and rounds tracking features',
          'Incorporated stakeholder and mentor feedback to refine MVP functionality',
          'Utilized GitHub pull requests for feature development and peer code reviews',
          'Collaborated with team members through branch-based workflow and PR discussions',
          'Implemented responsive header component with user authentication state management',
          'Designed and built navigation system with protected routes',
          'Styled header with Tailwind CSS including hover effects, transitions, and backdrop blur',
          'Integrated sign-out functionality with loading states for better UX',
          'Updated UI styling and maintained consistent design system across team contributions',
          'Participated in code reviews and iterative improvements through GitHub PRs',
          'Coordinated with team on Firebase integration for authentication flows'
        ]
      }
    ],
    technologies: [
      'Next.js 15',
      'React 19',
      'TypeScript',
      'Firebase Authentication',
      'Cloud Firestore',
      'Firebase Admin SDK',
      'Tailwind CSS 4',
      'Lucide React',
      'React Icons',
      'PDF.js',
      'Server Components',
      'API Routes',
      'Protected Routes',
      'Real-time Database',
      'Google Sign-In'
    ]
  },
  {
    id: 'aerocast',
    title: 'AeroCast',
    subtitle: 'NASA Space Apps Challenge',
    shortDescription: 'Air quality prediction system performing feature engineering on NASA TEMPO satellite data combined with weather and ground monitor data for hyperlocal AQI prediction.',
    color: 'blue',
    hasDetails: true,
    links: [
      { label: 'GitHub Repository', url: 'https://github.com/kalinpatel/space-apps' }
    ],
    tags: ['XGBoost', 'Azure ML', 'LSTM', 'Random Forest', 'NASA TEMPO', 'Time Series'],
    highlights: [
      'Azure ML deployment with production-ready model serving',
      'Multi-pollutant prediction across various time horizons',
      'Feature engineering on NASA TEMPO satellite data',
      'Gemini API integration for AQI interpretation and recommendations'
    ],
    overview: [
      'AeroCast is an air quality prediction system developed for the NASA Space Apps Challenge, combining NASA TEMPO satellite data with weather information and ground monitor data to provide hyperlocal AQI predictions.',
      'The system uses advanced machine learning techniques including XGBoost, LSTM, and Random Forest models to forecast air quality metrics across multiple pollutants (PM2.5, CO, SO2, PM10, CO2) at various prediction time lengths',
      'My primary contribution focused on ML model training, optimization, and Azure ML deployment, including setting up Azure Blob Storage for training data management and creating a production-ready model serving infrastructure. Successfully achieved accurate multi-pollutant predictions across various time horizons by integrating NASA TEMPO satellite data with traditional monitoring sources. Implemented intelligent AQI interpretation using Gemini API to provide personalized health recommendations and natural language explanations to users.'
    ],
    architectureSections: [
      {
        title: 'Model Training & Performance',
        subsections: [
          {
            title: 'Multi-Pollutant Prediction Models',
            content: 'Training and validation loss curves across multiple pollutants (PM2.5, CO, SO2, PM10, CO2) at different prediction time lengths.',
            images: [
              { src: '/src/images/Aerocast1.png', alt: 'Training and Validation Loss Curves', caption: 'Training and validation loss curves across multiple pollutants at different prediction time lengths' }
            ]
          },
          {
            title: 'Feature Importance Analysis',
            content: 'Analysis of the most important features driving AQI predictions, including NASA TEMPO satellite measurements, weather data, temporal features, and ground monitor readings.',
            images: [
              { src: '/src/images/Aerocast2.png', alt: 'Feature Importance', caption: 'Most important features for air quality prediction including satellite data, weather conditions, and temporal patterns' }
            ]
          },
          {
            title: 'Seattle 6-Hour Forecasts',
            content: 'Model predictions for 5 test samples in Seattle showing 6-hour ahead forecasts. Dotted lines represent model predictions compared to actual measured values for each pollutant.',
            images: [
              { src: '/src/images/Aerocast3.png', alt: 'Seattle 6-Hour Forecasts', caption: 'Seattle 6-hour air quality forecasts for 5 test samples - dotted lines show model predictions vs actual values' }
            ]
          }
        ]
      },
      {
        title: 'Azure ML Deployment Architecture',
        subsections: [
          {
            title: 'Production Model Serving (My Primary Contribution)',
            content: 'Azure Machine Learning deployment architecture showing the complete ML pipeline from data storage to model serving. I led the implementation of model training, optimization, and Azure ML deployment, including Azure Blob Storage setup for training data management.',
            points: [
              'Azure ML Workspace for model training and versioning',
              'Azure Blob Storage for training data and model artifacts',
              'Containerized model deployment with REST API endpoints',
              'Scalable inference infrastructure for real-time predictions',
              'Model monitoring and performance tracking'
            ],
            images: [
              { src: '/src/images/Aerocast4.png', alt: 'Azure ML Deployment Architecture', caption: 'Architecture diagram which also shows Azure ML deployment architecture' }
            ]
          }
        ]
      },
      {
        title: 'Web Application & User Experience',
        subsections: [
          {
            title: 'AeroCast Platform with Gemini API Integration',
            content: 'Interactive web platform displaying air quality predictions with Gemini API integration for intelligent AQI interpretation. The system generates personalized recommendations and explains AQI ranges and values to users in natural language.',
            points: [
              'Real-time AQI predictions for multiple pollutants',
              'Interactive graphs with model predictions (dotted lines) vs actual values',
              'Gemini API for generating health recommendations based on AQI levels',
              'Natural language explanations of pollutant ranges and health impacts',
              'User-friendly visualization of complex air quality data'
            ],
            images: [
              { src: '/src/images/Aerocast5.png', alt: 'AeroCast Website with Gemini API', caption: 'AeroCast web platform featuring Gemini API integration for AQI interpretation, recommendations, and explanations of pollutant ranges' }
            ]
          }
        ]
      }
    ],
    keyFeatures: [
      {
        title: 'Multi-Pollutant Prediction',
        description: 'Forecasts for PM2.5, CO, SO2, PM10, and CO2 using ensemble learning techniques.'
      },
      {
        title: 'NASA TEMPO Integration',
        description: 'Feature engineering on NASA TEMPO satellite data combined with weather and ground monitor readings for comprehensive air quality analysis.'
      },
      {
        title: 'Azure ML Production Deployment',
        description: 'Scalable model serving infrastructure with Azure Machine Learning and Blob Storage for efficient data management and model versioning.'
      },
      {
        title: 'Gemini API Intelligence',
        description: 'AI-powered interpretation of AQI data generating personalized health recommendations and natural language explanations of air quality metrics.'
      }
    ],
    technologies: [
      'XGBoost',
      'LSTM',
      'Random Forest',
      'Azure Machine Learning',
      'Azure Blob Storage',
      'NASA TEMPO Satellite Data',
      'Gemini API',
      'Python',
      'Scikit-learn',
      'Time Series Forecasting',
      'Feature Engineering',
      'Model Deployment',
      'REST APIs'
    ]
  },
  {
    id: 'leadership',
    title: 'Leadership & Competitions',
    subtitle: 'CS, Math, and Science Clubs President',
    shortDescription: 'Led teams to victories at Stonehill Science Bowl, Strawberry Fields Hackathon, and Mathelogics Research Symposium.',
    color: 'purple',
    hasDetails: false,
    highlights: [
      'Organized Indus International Hackathon 2023 connecting 60+ teams'
    ],
    tags: ['Leadership', 'Event Organization', 'Team Management']
  },
  {
    id: 'research',
    title: 'Research: Object Detection Architectures',
    subtitle: 'International Baccalaureate Extended Essay',
    shortDescription: 'Comparative analysis of YOLO vs R-CNN architectures for car detection using PyTorch, examining trade-offs between speed and accuracy in real-time object detection systems.',
    color: 'pink',
    featured: true,
    hasDetails: false,
    tags: ['YOLO', 'R-CNN', 'PyTorch', 'Computer Vision', 'Academic Research']
  }
];

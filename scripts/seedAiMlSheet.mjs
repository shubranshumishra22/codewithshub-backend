import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

const AI_ML_DATA = [
  {
    moduleName: 'Module 1 — ML Foundations (Days 1–14)',
    topicName: 'Introduction to Machine Learning',
    questions: [
      { title: 'What is Machine Learning?', difficulty: 'easy' },
      { title: 'AI vs ML vs DL', difficulty: 'easy' },
      { title: 'Types of Machine Learning', difficulty: 'easy' },
      { title: 'Batch Learning', difficulty: 'easy' },
      { title: 'Online Learning', difficulty: 'easy' },
      { title: 'Instance-Based vs Model-Based Learning', difficulty: 'easy' },
      { title: 'Challenges in Machine Learning', difficulty: 'easy' },
      { title: 'Applications of Machine Learning', difficulty: 'easy' },
      { title: 'ML Development Life Cycle (MLDLC)', difficulty: 'easy' },
      { title: 'Data Engineer vs Data Analyst vs Data Scientist vs ML Engineer', difficulty: 'easy' },
      { title: 'How to Frame an ML Problem', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'Module 1 — ML Foundations (Days 1–14)',
    topicName: 'Mathematical Foundations & Tools',
    questions: [
      { title: 'What are Tensors?', difficulty: 'easy' },
      { title: 'Installing Anaconda, Jupyter & Colab', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'Module 1 — ML Foundations (Days 1–14)',
    topicName: 'End-to-End Projects',
    questions: [
      { title: 'End-to-End Toy Project', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Module 2 — Data Collection & EDA (Days 15–22)',
    topicName: 'Data Collection',
    questions: [
      { title: 'Working with CSV Files', difficulty: 'easy' },
      { title: 'Working with JSON & SQL', difficulty: 'medium' },
      { title: 'Fetching Data from APIs', difficulty: 'easy' },
      { title: 'Web Scraping', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Module 2 — Data Collection & EDA (Days 15–22)',
    topicName: 'Exploratory Data Analysis',
    questions: [
      { title: 'Understanding Your Data', difficulty: 'easy' },
      { title: 'Univariate EDA', difficulty: 'easy' },
      { title: 'Bivariate & Multivariate EDA', difficulty: 'medium' },
      { title: 'Pandas Profiling', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'Module 3 — Feature Engineering (Days 23–49)',
    topicName: 'Feature Scaling & Encoding',
    questions: [
      { title: 'Introduction to Feature Engineering', difficulty: 'easy' },
      { title: 'Standardization', difficulty: 'easy' },
      { title: 'Normalization (MinMax, Robust, MaxAbs)', difficulty: 'easy' },
      { title: 'Ordinal & Label Encoding', difficulty: 'easy' },
      { title: 'One-Hot Encoding', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'Module 3 — Feature Engineering (Days 23–49)',
    topicName: 'Pipelines & Transformers',
    questions: [
      { title: 'Column Transformer', difficulty: 'medium' },
      { title: 'ML Pipelines', difficulty: 'medium' },
      { title: 'Function Transformer', difficulty: 'medium' },
      { title: 'Power Transformer', difficulty: 'medium' },
      { title: 'Binning & Binarization', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'Module 3 — Feature Engineering (Days 23–49)',
    topicName: 'Handling Variables',
    questions: [
      { title: 'Handling Mixed Variables', difficulty: 'medium' },
      { title: 'Date & Time Features', difficulty: 'easy' },
      { title: 'Missing Value Handling (Simple Imputer, KNN, MICE, etc.)', difficulty: 'medium' },
      { title: 'Outlier Detection & Removal', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Module 3 — Feature Engineering (Days 23–49)',
    topicName: 'Dimensionality Reduction',
    questions: [
      { title: 'Feature Construction', difficulty: 'medium' },
      { title: 'Curse of Dimensionality', difficulty: 'easy' },
      { title: 'PCA (3 Parts)', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Module 4 — Linear Regression (Days 50–68)',
    topicName: 'Linear Regression Basics',
    questions: [
      { title: 'Simple Linear Regression', difficulty: 'easy' },
      { title: 'Regression Metrics', difficulty: 'easy' },
      { title: 'Multiple Linear Regression', difficulty: 'medium' },
      { title: 'Polynomial Regression', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Module 4 — Linear Regression (Days 50–68)',
    topicName: 'Optimization with Gradient Descent',
    questions: [
      { title: 'Gradient Descent (Full Series)', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Module 4 — Linear Regression (Days 50–68)',
    topicName: 'Regularization & Variance',
    questions: [
      { title: 'Bias–Variance Tradeoff', difficulty: 'easy' },
      { title: 'Ridge Regression', difficulty: 'medium' },
      { title: 'Lasso Regression', difficulty: 'medium' },
      { title: 'ElasticNet Regression', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Module 5 — Logistic Regression (Days 69–79)',
    topicName: 'Perceptron Foundations',
    questions: [
      { title: 'Perceptron Trick', difficulty: 'easy' },
      { title: 'Perceptron Trick (Code)', difficulty: 'medium' },
      { title: 'Sigmoid Function', difficulty: 'easy' },
      { title: 'Sigmoid Derivative', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Module 5 — Logistic Regression (Days 69–79)',
    topicName: 'Logistic Regression & Evaluation',
    questions: [
      { title: 'Loss Function & Binary Cross Entropy', difficulty: 'medium' },
      { title: 'Gradient Descent from Scratch', difficulty: 'hard' },
      { title: 'Accuracy & Confusion Matrix', difficulty: 'easy' },
      { title: 'Precision, Recall & F1', difficulty: 'easy' },
      { title: 'Softmax Regression', difficulty: 'medium' },
      { title: 'Polynomial Logistic Regression', difficulty: 'medium' },
      { title: 'Logistic Regression Hyperparameters', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Module 6 — Tree-Based Models (starts Day 80)',
    topicName: 'Decision Trees',
    questions: [
      { title: 'Decision Trees — Entropy, Gini, Information Gain', difficulty: 'medium' },
      { title: 'Decision Tree Hyperparameters', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Module 6 — Tree-Based Models (starts Day 80)',
    topicName: 'Ensembles & Other Algorithms',
    questions: [
      { title: 'Continues with Decision Trees, Random Forests, Ensemble Learning, SVM, Naive Bayes, KNN, Clustering, Recommendation Systems, etc., as new videos are added.', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'ANN (Days 1–39)',
    topicName: 'Introduction to Deep Learning',
    questions: [
      { title: 'Course Announcement', difficulty: 'easy' },
      { title: 'What is Deep Learning? Deep Learning vs Machine Learning', difficulty: 'easy' },
      { title: 'Types of Neural Networks | History | Applications', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'ANN (Days 1–39)',
    topicName: 'Perceptrons & Forward Propagation',
    questions: [
      { title: 'What is a Perceptron?', difficulty: 'easy' },
      { title: 'Perceptron Trick | Training a Perceptron', difficulty: 'medium' },
      { title: 'Perceptron Loss Function | BCE | Hinge Loss | Sigmoid', difficulty: 'medium' },
      { title: 'Problem with Perceptron', difficulty: 'easy' },
      { title: 'MLP Notation', difficulty: 'medium' },
      { title: 'Multi-Layer Perceptron (MLP) Intuition', difficulty: 'medium' },
      { title: 'Forward Propagation', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'ANN (Days 1–39)',
    topicName: 'Digit & Admission Projects',
    questions: [
      { title: 'Customer Churn Prediction using ANN', difficulty: 'medium' },
      { title: 'Handwritten Digit Classification (MNIST)', difficulty: 'medium' },
      { title: 'Graduate Admission Prediction', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'ANN (Days 1–39)',
    topicName: 'Backpropagation & Training',
    questions: [
      { title: 'Loss Functions in Deep Learning', difficulty: 'medium' },
      { title: 'Backpropagation Part 1', difficulty: 'hard' },
      { title: 'Backpropagation Part 2', difficulty: 'hard' },
      { title: 'Backpropagation Part 3', difficulty: 'hard' },
      { title: 'MLP Memoization', difficulty: 'medium' },
      { title: 'Gradient Descent (Batch vs SGD vs Mini-batch)', difficulty: 'medium' },
      { title: 'Vanishing & Exploding Gradient', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'ANN (Days 1–39)',
    topicName: 'Improving Performance & Optimization',
    questions: [
      { title: 'Improving Neural Network Performance', difficulty: 'medium' },
      { title: 'Early Stopping', difficulty: 'medium' },
      { title: 'Feature Scaling in ANN', difficulty: 'easy' },
      { title: 'Dropout Layer', difficulty: 'medium' },
      { title: 'Dropout Code Example', difficulty: 'medium' },
      { title: 'L1/L2 Regularization', difficulty: 'medium' },
      { title: 'Activation Functions', difficulty: 'easy' },
      { title: 'ReLU Variants', difficulty: 'medium' },
      { title: 'Weight Initialization', difficulty: 'medium' },
      { title: 'Xavier & He Initialization', difficulty: 'medium' },
      { title: 'Batch Normalization', difficulty: 'hard' },
      { title: 'Optimizers Part 1', difficulty: 'medium' },
      { title: 'Exponential Weighted Average', difficulty: 'medium' },
      { title: 'SGD with Momentum', difficulty: 'medium' },
      { title: 'Nesterov Accelerated Gradient (NAG)', difficulty: 'medium' },
      { title: 'AdaGrad', difficulty: 'medium' },
      { title: 'RMSProp', difficulty: 'medium' },
      { title: 'Adam Optimizer', difficulty: 'hard' },
      { title: 'Keras Tuner (Hyperparameter Tuning)', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'CNN (Days 40–51)',
    topicName: 'Convolution foundations',
    questions: [
      { title: 'What is CNN?', difficulty: 'easy' },
      { title: 'CNN vs Visual Cortex', difficulty: 'easy' },
      { title: 'Convolution Operation', difficulty: 'medium' },
      { title: 'Padding & Strides', difficulty: 'medium' },
      { title: 'Pooling, Flatten Layer, CNN vs ANN', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'CNN (Days 40–51)',
    topicName: 'CNN Backpropagation & Projects',
    questions: [
      { title: 'CNN Backpropagation Part 1', difficulty: 'hard' },
      { title: 'CNN Backpropagation Part 2', difficulty: 'hard' },
      { title: 'Cat vs Dog Classification Project', difficulty: 'medium' },
      { title: 'Data Augmentation', difficulty: 'medium' },
      { title: 'Pretrained Models (ImageNet)', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'RNN (Days 52–66)',
    topicName: 'Recurrent Neural Networks',
    questions: [
      { title: 'Problems with RNN', difficulty: 'medium' },
      { title: 'Simple RNN concepts and sequence modeling', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'RNN (Days 52–66)',
    topicName: 'Long Short-Term Memory (LSTM) & GRU',
    questions: [
      { title: 'LSTM Part 1', difficulty: 'hard' },
      { title: 'LSTM Part 2', difficulty: 'hard' },
      { title: 'Next Word Prediction using LSTM', difficulty: 'medium' },
      { title: 'GRU', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'RNN (Days 52–66)',
    topicName: 'Stacked & Bidirectional RNNs',
    questions: [
      { title: 'Deep/Stacked RNNs', difficulty: 'medium' },
      { title: 'Bidirectional RNN (BiLSTM)', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Sequence Models & Transformers (Days 67–84)',
    topicName: 'Encoder-Decoder & Attention',
    questions: [
      { title: 'History of LLMs', difficulty: 'easy' },
      { title: 'Encoder–Decoder Architecture', difficulty: 'medium' },
      { title: 'Attention Mechanism', difficulty: 'hard' },
      { title: 'Bahdanau vs Luong Attention', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Sequence Models & Transformers (Days 67–84)',
    topicName: 'Transformers & Self-Attention',
    questions: [
      { title: 'Introduction to Transformers', difficulty: 'medium' },
      { title: 'Self-Attention', difficulty: 'hard' },
      { title: 'Self-Attention with Code', difficulty: 'hard' },
      { title: 'Scaled Dot Product Attention', difficulty: 'hard' },
      { title: 'Geometric Intuition of Self-Attention', difficulty: 'medium' },
      { title: 'Why is it called Self-Attention?', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'Sequence Models & Transformers (Days 67–84)',
    topicName: 'Transformer Architecture Details',
    questions: [
      { title: 'Multi-Head Attention', difficulty: 'hard' },
      { title: 'Positional Encoding', difficulty: 'medium' },
      { title: 'Layer Normalization', difficulty: 'medium' },
      { title: 'Transformer Encoder', difficulty: 'hard' },
      { title: 'Masked Self-Attention', difficulty: 'hard' },
      { title: 'Cross Attention', difficulty: 'hard' },
      { title: 'Transformer Decoder', difficulty: 'hard' },
      { title: 'Transformer Inference', difficulty: 'hard' }
    ]
  }
];

const PYTORCH_DATA = [
  {
    moduleName: 'Basics',
    topicName: 'Installation & Tensors',
    questions: [
      { title: 'Installing PyTorch', difficulty: 'easy' },
      { title: 'Tensors', difficulty: 'easy' },
      { title: 'Tensor Operations', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'Basics',
    topicName: 'Core PyTorch Concepts',
    questions: [
      { title: 'Autograd', difficulty: 'medium' },
      { title: 'CUDA (GPU)', difficulty: 'medium' },
      { title: 'Tensor Broadcasting', difficulty: 'easy' },
      { title: 'Tensor Indexing', difficulty: 'easy' },
      { title: 'Tensor Reshaping', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'Neural Networks',
    topicName: 'nn.Module & Architecture',
    questions: [
      { title: 'nn.Module', difficulty: 'medium' },
      { title: 'Building Neural Networks', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Neural Networks',
    topicName: 'Training & Evaluation',
    questions: [
      { title: 'Training Loop', difficulty: 'medium' },
      { title: 'Loss Functions', difficulty: 'medium' },
      { title: 'Optimizers', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Neural Networks',
    topicName: 'Data & Storage',
    questions: [
      { title: 'Datasets & DataLoader', difficulty: 'medium' },
      { title: 'Custom Dataset', difficulty: 'hard' },
      { title: 'Saving & Loading Models', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Computer Vision',
    topicName: 'CNNs & Transfer Learning',
    questions: [
      { title: 'CNN in PyTorch', difficulty: 'medium' },
      { title: 'Transfer Learning', difficulty: 'medium' },
      { title: 'Image Classification', difficulty: 'medium' },
      { title: 'Fine Tuning', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Sequence Models',
    topicName: 'Recurrent Networks',
    questions: [
      { title: 'RNN', difficulty: 'medium' },
      { title: 'LSTM', difficulty: 'hard' },
      { title: 'GRU', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Advanced',
    topicName: 'Optimization & Scaling',
    questions: [
      { title: 'TensorBoard', difficulty: 'medium' },
      { title: 'Mixed Precision Training', difficulty: 'hard' },
      { title: 'Custom Layers', difficulty: 'hard' },
      { title: 'Deployment Basics', difficulty: 'medium' }
    ]
  }
];

const NLP_DATA = [
  {
    moduleName: 'Fundamentals',
    topicName: 'Text Preprocessing',
    questions: [
      { title: 'Introduction to NLP', difficulty: 'easy' },
      { title: 'Text Preprocessing', difficulty: 'easy' },
      { title: 'Regular Expressions', difficulty: 'medium' },
      { title: 'Tokenization', difficulty: 'easy' },
      { title: 'Stop Words', difficulty: 'easy' },
      { title: 'Stemming', difficulty: 'easy' },
      { title: 'Lemmatization', difficulty: 'easy' }
    ]
  },
  {
    moduleName: 'Fundamentals',
    topicName: 'Vectorization & Embeddings',
    questions: [
      { title: 'Feature Extraction', difficulty: 'easy' },
      { title: 'Bag of Words', difficulty: 'easy' },
      { title: 'TF-IDF', difficulty: 'easy' },
      { title: 'Word2Vec', difficulty: 'medium' },
      { title: 'FastText', difficulty: 'medium' },
      { title: 'GloVe', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Classical NLP',
    topicName: 'Classification & Recognition',
    questions: [
      { title: 'Text Classification', difficulty: 'medium' },
      { title: 'Sentiment Analysis', difficulty: 'medium' },
      { title: 'Spam Detection', difficulty: 'easy' },
      { title: 'Named Entity Recognition', difficulty: 'hard' },
      { title: 'POS Tagging', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Deep NLP',
    topicName: 'Recurrent & Attention Networks',
    questions: [
      { title: 'RNN for NLP', difficulty: 'medium' },
      { title: 'LSTM', difficulty: 'hard' },
      { title: 'Attention', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Transformers',
    topicName: 'Transformer Architecture & LLMs',
    questions: [
      { title: 'Transformers', difficulty: 'hard' },
      { title: 'BERT', difficulty: 'hard' },
      { title: 'GPT', difficulty: 'hard' },
      { title: 'Hugging Face Transformers', difficulty: 'medium' },
      { title: 'Fine-tuning Transformers', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Downstream Tasks',
    topicName: 'Practical NLP Tasks',
    questions: [
      { title: 'Question Answering', difficulty: 'hard' },
      { title: 'Text Summarization', difficulty: 'hard' }
    ]
  }
];

const RAG_DATA = [
  {
    moduleName: 'Foundations',
    topicName: 'RAG Basics',
    questions: [
      { title: 'What is RAG?', difficulty: 'easy' },
      { title: 'RAG Architecture', difficulty: 'easy' },
      { title: 'Embeddings', difficulty: 'easy' },
      { title: 'Vector Databases', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Chunking & Text Splitting',
    topicName: 'Chunking Strategies',
    questions: [
      { title: 'Chunking', difficulty: 'medium' },
      { title: 'Text Splitting', difficulty: 'easy' },
      { title: 'Chunk Size', difficulty: 'easy' },
      { title: 'Chunk Overlap', difficulty: 'easy' },
      { title: 'Metadata', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Embedding Models',
    topicName: 'Models & Benchmarks',
    questions: [
      { title: 'Sentence Transformers', difficulty: 'medium' },
      { title: 'OpenAI Embeddings', difficulty: 'medium' },
      { title: 'BGE Models', difficulty: 'medium' },
      { title: 'E5 Models', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Vector Databases',
    topicName: 'DB Implementations',
    questions: [
      { title: 'FAISS', difficulty: 'medium' },
      { title: 'ChromaDB', difficulty: 'medium' },
      { title: 'Pinecone', difficulty: 'medium' },
      { title: 'Weaviate', difficulty: 'hard' },
      { title: 'Qdrant', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Retrieval',
    topicName: 'Search & Re-ranking',
    questions: [
      { title: 'Similarity Search', difficulty: 'medium' },
      { title: 'Hybrid Search', difficulty: 'hard' },
      { title: 'BM25', difficulty: 'medium' },
      { title: 'Reranking', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Frameworks',
    topicName: 'Orchestration Tools',
    questions: [
      { title: 'LangChain', difficulty: 'medium' },
      { title: 'LlamaIndex', difficulty: 'medium' },
      { title: 'Haystack', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Projects',
    topicName: 'Hands-on RAG Apps',
    questions: [
      { title: 'PDF Chatbot', difficulty: 'hard' },
      { title: 'Resume Chatbot', difficulty: 'hard' },
      { title: 'Website Chatbot', difficulty: 'hard' },
      { title: 'Multi-document QA', difficulty: 'hard' },
      { title: 'Production RAG Pipeline', difficulty: 'hard' }
    ]
  }
];

const AGENTIC_AI_DATA = [
  {
    moduleName: 'Foundations',
    topicName: 'Agent Core Concepts',
    questions: [
      { title: 'What are AI Agents?', difficulty: 'easy' },
      { title: 'LLM APIs', difficulty: 'easy' },
      { title: 'Prompt Engineering', difficulty: 'medium' },
      { title: 'Function Calling', difficulty: 'hard' },
      { title: 'Structured Outputs', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Foundations',
    topicName: 'Tool Integration',
    questions: [
      { title: 'Tool Use', difficulty: 'medium' },
      { title: 'Search Tools', difficulty: 'medium' },
      { title: 'Calculator Tools', difficulty: 'easy' },
      { title: 'Database Tools', difficulty: 'medium' },
      { title: 'API Integration', difficulty: 'medium' },
      { title: 'Python Tool Calling', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Frameworks',
    topicName: 'Agent Frameworks',
    questions: [
      { title: 'LangGraph', difficulty: 'hard' },
      { title: 'LangChain Agents', difficulty: 'medium' },
      { title: 'CrewAI', difficulty: 'medium' },
      { title: 'AutoGen', difficulty: 'hard' },
      { title: 'Pydantic AI', difficulty: 'medium' }
    ]
  },
  {
    moduleName: 'Memory',
    topicName: 'Agent Memory Architectures',
    questions: [
      { title: 'Memory', difficulty: 'medium' },
      { title: 'Short-term Memory', difficulty: 'medium' },
      { title: 'Long-term Memory', difficulty: 'medium' },
      { title: 'Conversation Memory', difficulty: 'medium' },
      { title: 'Vector Memory', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Multi-Agent Systems',
    topicName: 'Agent Roles & Patterns',
    questions: [
      { title: 'Multi-Agent Systems', difficulty: 'medium' },
      { title: 'Planner Agent', difficulty: 'medium' },
      { title: 'Research Agent', difficulty: 'medium' },
      { title: 'Coding Agent', difficulty: 'medium' },
      { title: 'Reviewer Agent', difficulty: 'medium' },
      { title: 'Supervisor Pattern', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Advanced',
    topicName: 'Agentic Optimization & MCP',
    questions: [
      { title: 'Reflection', difficulty: 'hard' },
      { title: 'Self-Correction', difficulty: 'hard' },
      { title: 'Human-in-the-loop', difficulty: 'hard' },
      { title: 'Workflow Automation', difficulty: 'medium' },
      { title: 'MCP (Model Context Protocol)', difficulty: 'hard' },
      { title: 'A2A (Agent-to-Agent Communication)', difficulty: 'hard' }
    ]
  },
  {
    moduleName: 'Projects',
    topicName: 'Autonomous Agent Apps',
    questions: [
      { title: 'AI Research Assistant', difficulty: 'hard' },
      { title: 'AI Coding Assistant', difficulty: 'hard' },
      { title: 'Email Agent', difficulty: 'hard' },
      { title: 'Customer Support Agent', difficulty: 'hard' },
      { title: 'Autonomous Browser Agent', difficulty: 'hard' },
      { title: 'Multi-Agent Software Development System', difficulty: 'hard' }
    ]
  }
];

async function main() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
  }

  const seedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions);

  // 1. Delete all old/separate sheets if they exist to keep the system clean
  const sheetsToDelete = [
    'Coder Army 180 Days',
    'PyTorch Playlist',
    'NLP Playlist',
    'RAG (Retrieval-Augmented Generation)',
    'Agentic AI'
  ];

  for (const sheetName of sheetsToDelete) {
    console.log(`Searching for sheet "${sheetName}" to delete...`);
    const { data: sheetsFound, error: fetchErr } = await seedClient
      .from('sheets')
      .select('id')
      .eq('name', sheetName);

    if (fetchErr) throw fetchErr;

    if (sheetsFound && sheetsFound.length > 0) {
      console.log(`Deleting sheet "${sheetName}" (id: ${sheetsFound[0].id})...`);
      const { error: deleteError } = await seedClient
        .from('sheets')
        .delete()
        .eq('name', sheetName);

      if (deleteError) throw deleteError;
      console.log(`Deleted "${sheetName}" successfully.`);
    }
  }

  // 2. Setup combined "AI/ML" sheet
  const sheetName = 'AI/ML';
  console.log(`Setting up sheet "${sheetName}"...`);
  const { data: existingSheets, error: sheetFetchError } = await seedClient
    .from('sheets')
    .select('id, name')
    .eq('name', sheetName)
    .limit(1);

  if (sheetFetchError) throw sheetFetchError;

  let sheet = existingSheets?.find(s => s.name === sheetName) || null;

  if (!sheet) {
    const { data: insertedSheet, error: sheetInsertError } = await seedClient
      .from('sheets')
      .insert([{ name: sheetName, description: 'Comprehensive AI, Machine Learning, Deep Learning, PyTorch, NLP, RAG, and Agentic AI curricula.' }])
      .select('id, name')
      .single();

    if (sheetInsertError) throw sheetInsertError;
    sheet = insertedSheet;
    console.log(`Created new combined sheet: ${sheet.name} (id: ${sheet.id})`);
  } else {
    console.log(`Sheet "${sheetName}" already exists (id: ${sheet.id}). Re-seeding topics...`);
    // Clear existing topics of this sheet so we do a clean seed
    const { error: clearTopicsError } = await seedClient
      .from('topics')
      .delete()
      .eq('sheet_id', sheet.id);
    if (clearTopicsError) throw clearTopicsError;
  }

  // 3. Prepare all topics list with categories
  const dlModules = ['ANN (Days 1–39)', 'CNN (Days 40–51)', 'RNN (Days 52–66)', 'Sequence Models & Transformers (Days 67–84)'];
  const allTopicsData = [];

  // Machine Learning (ML) vs Deep Learning (DL)
  AI_ML_DATA.forEach((t) => {
    const cat = dlModules.includes(t.moduleName) ? 'DL' : 'ML';
    allTopicsData.push({ ...t, category: cat });
  });

  // PyTorch
  PYTORCH_DATA.forEach((t) => {
    allTopicsData.push({ ...t, category: 'PyTorch' });
  });

  // NLP
  NLP_DATA.forEach((t) => {
    allTopicsData.push({ ...t, category: 'NLP' });
  });

  // RAG
  RAG_DATA.forEach((t) => {
    allTopicsData.push({ ...t, category: 'RAG' });
  });

  // Agentic AI
  AGENTIC_AI_DATA.forEach((t) => {
    allTopicsData.push({ ...t, category: 'Agentic' });
  });

  // Map to Topics upsert format
  const topicsToUpsert = allTopicsData.map((t, idx) => ({
    sheet_id: sheet.id,
    name: t.topicName,
    module: t.moduleName,
    category: t.category,
    order_index: idx + 1,
  }));

  console.log(`Inserting ${topicsToUpsert.length} topics...`);
  const { error: topicError } = await seedClient
    .from('topics')
    .upsert(topicsToUpsert, { onConflict: 'sheet_id,order_index' });

  if (topicError) throw topicError;
  console.log('Topics upserted successfully.');

  // Fetch the saved topics to map their IDs
  const { data: savedTopics, error: savedTopicsError } = await seedClient
    .from('topics')
    .select('id, name, order_index')
    .eq('sheet_id', sheet.id);

  if (savedTopicsError) throw savedTopicsError;
  const topicIdByOrder = new Map(savedTopics.map(t => [t.order_index, t.id]));

  // 4. Prepare questions to upsert
  const questionsToUpsert = [];
  allTopicsData.forEach((t, tIdx) => {
    const topicId = topicIdByOrder.get(tIdx + 1);
    t.questions.forEach((q, qIdx) => {
      questionsToUpsert.push({
        topic_id: topicId,
        title: q.title,
        difficulty: q.difficulty,
        leetcode_url: null,
        video_url: null,
        order_index: qIdx + 1,
      });
    });
  });

  console.log(`Inserting ${questionsToUpsert.length} questions...`);
  const { error: questionError } = await seedClient
    .from('questions')
    .upsert(questionsToUpsert, { onConflict: 'topic_id,order_index' });

  if (questionError) throw questionError;
  console.log(`Seeded "${sheetName}" Sheet with combined tracks: ${allTopicsData.length} topics, ${questionsToUpsert.length} questions successfully.`);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exitCode = 1;
});

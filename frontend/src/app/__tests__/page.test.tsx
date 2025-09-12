import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock next/link
jest.mock('next/link', () => {
  return function MockedLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('Home Page', () => {
  it('renders the main title', () => {
    render(<Home />);
    
    const title = screen.getByRole('heading', { name: /BZ StudyPal/i });
    expect(title).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<Home />);
    
    const subtitle = screen.getByRole('heading', { name: /智能错题管理系统/i });
    expect(subtitle).toBeInTheDocument();
  });

  it('displays feature cards', () => {
    render(<Home />);
    
    // Check for feature sections
    expect(screen.getByText('📚 错题管理')).toBeInTheDocument();
    expect(screen.getByText('📈 学习统计')).toBeInTheDocument();
    expect(screen.getByText('📝 复习计划')).toBeInTheDocument();
  });

  it('displays feature descriptions', () => {
    render(<Home />);
    
    expect(screen.getByText('智能分类和标签管理')).toBeInTheDocument();
    expect(screen.getByText('可视化的进度分析')).toBeInTheDocument();
    expect(screen.getByText('个性化复习推荐')).toBeInTheDocument();
  });

  it('has login and register buttons', () => {
    render(<Home />);
    
    const loginLink = screen.getByRole('link', { name: /🔑 立即登录/i });
    const registerLink = screen.getByRole('link', { name: /👤 免费注册/i });
    
    expect(loginLink).toBeInTheDocument();
    expect(registerLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/auth/login');
    expect(registerLink).toHaveAttribute('href', '/auth/register');
  });

  it('displays version information', () => {
    render(<Home />);
    
    expect(screen.getByText(/版本 1\.0\.0 - MVP 测试版/i)).toBeInTheDocument();
  });

  it('has gradient background styles', () => {
    render(<Home />);
    
    // Check the outermost div has gradient background
    const gradientContainer = document.querySelector('.bg-gradient-to-br');
    expect(gradientContainer).toHaveClass('min-h-screen', 'bg-gradient-to-br', 'from-blue-600', 'to-purple-600');
  });

  it('has responsive design classes', () => {
    render(<Home />);
    
    const featuresGrid = screen.getByText('📚 错题管理').closest('.grid');
    expect(featuresGrid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    
    const buttonsContainer = screen.getByText('🔑 立即登录').closest('.flex');
    expect(buttonsContainer).toHaveClass('flex-col', 'sm:flex-row');
  });

  it('uses semantic HTML structure', () => {
    render(<Home />);
    
    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 1 });
    const subHeading = screen.getByRole('heading', { level: 2 });
    const featureHeadings = screen.getAllByRole('heading', { level: 3 });
    
    expect(mainHeading).toBeInTheDocument();
    expect(subHeading).toBeInTheDocument();
    expect(featureHeadings).toHaveLength(3);
  });

  it('has accessibility-friendly contrast', () => {
    render(<Home />);
    
    // Test that text has sufficient contrast classes
    const description = screen.getByText(/双语版MVP错题管理与复习系统/i);
    expect(description).toHaveClass('text-gray-600');
  });
});

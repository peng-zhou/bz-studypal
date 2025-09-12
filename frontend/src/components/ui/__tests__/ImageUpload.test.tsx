import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUpload from '../ImageUpload';

// Mock the API
jest.mock('../../../lib/api', () => ({
  questionsAPI: {
    uploadImages: jest.fn(),
    deleteImage: jest.fn()
  }
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.dropFilesHere': 'Drop files here',
        'common.dragDropOrClick': 'Drag & drop images here, or click to select',
        'common.supportedFormats': 'Supported formats',
        'common.maxFileSize': 'Max file size',
        'common.maxFiles': 'Max files',
        'common.imagesUploaded': 'images uploaded',
        'common.uploading': 'Uploading...',
        'common.imageUpload.title': 'Question Images'
      };
      return translations[key] || key;
    }
  })
}));

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({ 'data-testid': 'file-input' }),
    isDragActive: false
  }))
}));

describe('ImageUpload Component', () => {
  const defaultProps = {
    images: [],
    onChange: jest.fn(),
    maxFiles: 5,
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload area when no images are present', () => {
    render(<ImageUpload {...defaultProps} />);
    
    expect(screen.getByText('Drag & drop images here, or click to select')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: PNG, JPG, JPEG, GIF, WEBP')).toBeInTheDocument();
    expect(screen.getByText('Max file size: 5MB, Max files: 5')).toBeInTheDocument();
  });

  test('displays existing images when provided', () => {
    const images = ['/uploads/questions/image1.jpg', '/uploads/questions/image2.jpg'];
    render(<ImageUpload {...defaultProps} images={images} />);
    
    expect(screen.getByAltText('Question image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Question image 2')).toBeInTheDocument();
    expect(screen.getByText('2 / 5 images uploaded')).toBeInTheDocument();
  });

  test('does not show upload area when max files reached', () => {
    const images = Array.from({ length: 5 }, (_, i) => `/uploads/questions/image${i + 1}.jpg`);
    render(<ImageUpload {...defaultProps} images={images} />);
    
    expect(screen.queryByText('Drag & drop images here, or click to select')).not.toBeInTheDocument();
    expect(screen.getByText('5 / 5 images uploaded')).toBeInTheDocument();
  });

  test('renders properly when disabled', () => {
    const { container } = render(<ImageUpload {...defaultProps} disabled={true} />);
    
    // Component should render without errors when disabled
    expect(container.firstChild).toBeInTheDocument();
  });

  test('handles empty images array properly', () => {
    render(<ImageUpload {...defaultProps} images={[]} />);
    
    expect(screen.getByText('Drag & drop images here, or click to select')).toBeInTheDocument();
    expect(screen.queryByText('images uploaded')).not.toBeInTheDocument();
  });
});

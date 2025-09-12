'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import {
  Button,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

const languages = [
  { code: 'zh', name: '中文', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

interface LanguageSwitcherProps {
  variant?: 'button' | 'icon';
}

export default function LanguageSwitcher({ variant = 'button' }: LanguageSwitcherProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const currentLanguage = languages.find(lang => lang.code === router.locale);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLanguageChange = (languageCode: string) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: languageCode });
    handleClose();
  };
  
  if (variant === 'icon') {
    return (
      <>
        <IconButton
          onClick={handleClick}
          size=\"large\"
          aria-label={t('language.switch')}
          color=\"inherit\"
        >
          <LanguageIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {languages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={language.code === router.locale}
            >
              <ListItemIcon>
                {language.code === router.locale && <CheckIcon />}
              </ListItemIcon>
              <ListItemText primary={language.nativeName} />
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }
  
  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        variant=\"outlined\"
        size=\"small\"
      >
        {currentLanguage?.nativeName || 'Language'}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === router.locale}
          >
            <ListItemIcon>
              {language.code === router.locale && <CheckIcon />}
            </ListItemIcon>
            <ListItemText 
              primary={language.nativeName}
              secondary={language.name}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

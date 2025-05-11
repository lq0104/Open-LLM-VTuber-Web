// import { StrictMode } from 'react';
import {
  Box, Flex, ChakraProvider, defaultSystem,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import Canvas from './components/canvas/canvas';
import Sidebar from './components/sidebar/sidebar';
import Footer from './components/footer/footer';
import { AiStateProvider } from './context/ai-state-context';
import { Live2DConfigProvider } from './context/live2d-config-context';
import { SubtitleProvider } from './context/subtitle-context';
import { BgUrlProvider } from './context/bgurl-context';
import { layoutStyles } from './layout';
import WebSocketHandler from './services/websocket-handler';
import { CameraProvider } from './context/camera-context';
import { ChatHistoryProvider } from './context/chat-history-context';
import { CharacterConfigProvider } from './context/character-config-context';
import { Toaster } from './components/ui/toaster';
import { VADProvider } from './context/vad-context';
import { Live2D } from './components/canvas/live2d';
import TitleBar from './components/electron/title-bar';
import { Live2DModelProvider } from './context/live2d-model-context';
import { InputSubtitle } from './components/electron/input-subtitle';
import { ProactiveSpeakProvider } from './context/proactive-speak-context';
import { ScreenCaptureProvider } from './context/screen-capture-context';
import { GroupProvider } from './context/group-context';
// eslint-disable-next-line import/no-extraneous-dependencies, import/newline-after-import
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { wsService } from './services/websocket-service';
import { sidebarStyles } from './components/sidebar/sidebar-styles';

function App(): JSX.Element {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);
  const [mode, setMode] = useState('window');
  const [languageHelpList, setLanguageHelpList] = useState<any[]>([]);
  const isElectron = window.api !== undefined;
  useEffect(() => {
    if (isElectron) {
      window.electron.ipcRenderer.on('pre-mode-changed', (_event, newMode) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.electron.ipcRenderer.send('renderer-ready-for-mode-change', newMode);
          });
        });
      });
    }
  }, [isElectron]);

  useEffect(() => {
    if (isElectron) {
      window.electron.ipcRenderer.on('mode-changed', (_event, newMode) => {
        setMode(newMode);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.electron.ipcRenderer.send('mode-change-rendered');
          });
        });
      });
    }
  }, [isElectron]);

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // 通过wsService.onMessage订阅消息
    const sub = wsService.onMessage((msg: any) => {
      if (msg && msg.language_help) {
        setLanguageHelpList(prev => [...prev, msg.language_help]);
        setShowRightPanel(true);
      }
    });
    return () => sub.unsubscribe();
  }, []);

  return (
    <ChakraProvider value={defaultSystem}>
      <Live2DModelProvider>
        <CameraProvider>
          <ScreenCaptureProvider>
            <CharacterConfigProvider>
              <ChatHistoryProvider>
                <AiStateProvider>
                  <ProactiveSpeakProvider>
                    <Live2DConfigProvider>
                      <SubtitleProvider>
                        <VADProvider>
                          <BgUrlProvider>
                            <GroupProvider>
                              <WebSocketHandler>
                                <Toaster />
                                {mode === 'window' ? (
                                  <>
                                    {isElectron && <TitleBar />}
                                    <Flex {...layoutStyles.appContainer}>
                                      <Box
                                        {...layoutStyles.sidebar}
                                        {...(!showSidebar && { width: '24px' })}
                                      >
                                        <Sidebar
                                          isCollapsed={!showSidebar}
                                          onToggle={() => setShowSidebar(!showSidebar)}
                                        />
                                      </Box>
                                      <Box {...layoutStyles.mainContent}>
                                        {/* <Box {...layoutStyles.canvas}> */}
                                        <Canvas />
                                        {/* <InputSubtitle isPet={false} /> */}
                                        {/* </Box> */}
                                        <Box
                                          {...layoutStyles.footer}
                                          {...(isFooterCollapsed
                                            && layoutStyles.collapsedFooter)}
                                        >
                                          <Footer
                                            isCollapsed={isFooterCollapsed}
                                            onToggle={() => setIsFooterCollapsed(
                                              !isFooterCollapsed,
                                            )}
                                          />
                                        </Box>
                                      </Box>
                                      <Box
                                        position="relative"
                                        width={showRightPanel ? { base: '100%', md: '440px' } : '24px'}
                                        height={{ base: 'auto', md: '100%' }}
                                        bg="gray.800"
                                        borderLeft="1px solid"
                                        borderColor="whiteAlpha.200"
                                        overflow="hidden"
                                        flexShrink={0}
                                        transition="all 0.2s"
                                        display="flex"
                                        flexDirection="column"
                                      >
                                        <Box
                                          position="absolute"
                                          left={0}
                                          top={0}
                                          width="24px"
                                          height="100%"
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="center"
                                          cursor="pointer"
                                          color="whiteAlpha.700"
                                          _hover={{ color: 'white' }}
                                          bg="transparent"
                                          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                          zIndex={1}
                                          onClick={() => setShowRightPanel(!showRightPanel)}
                                        >
                                          {showRightPanel ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
                                        </Box>
                                        {showRightPanel && (
                                          <Box flex={1} minHeight={0} display="flex" flexDirection="column" color="white" p={4}>
                                            <Box
                                              width="100%"
                                              flex={1}
                                              minHeight={0}
                                              maxHeight="calc(100vh - 48px)"
                                              overflowY="auto"
                                              pr={2}
                                              css={sidebarStyles.chatHistoryPanel.messageList.css}
                                            >
                                              <Box fontWeight="bold" mb={2} fontSize="lg">语言帮助</Box>
                                              {languageHelpList.length === 0 ? (
                                                <Box color="gray.400">暂无语言帮助</Box>
                                              ) : (
                                                languageHelpList.map((languageHelp, idx) => (
                                                  <Box key={idx} mb={4} pb={2} borderBottom="1px solid" borderColor="whiteAlpha.200">
                                                    {typeof languageHelp === 'object' && Object.keys(languageHelp).length > 0 ? (
                                                      <Box as="ul" pl={4}>
                                                        {Object.entries(languageHelp).map(([k, v]) => (
                                                          <li key={String(k)} style={{marginBottom: 8}}>{String(k)} <span style={{color:'#4fd1c5'}}>&rarr;</span> {String(v)}</li>
                                                        ))}
                                                      </Box>
                                                    ) : (
                                                      <Box>{String(languageHelp)}</Box>
                                                    )}
                                                  </Box>
                                                ))
                                              )}
                                            </Box>
                                          </Box>
                                        )}
                                      </Box>
                                    </Flex>
                                  </>
                                ) : (
                                  <>
                                    <Live2D isPet={mode === 'pet'} />
                                    {mode === 'pet' && (
                                      <InputSubtitle isPet={mode === 'pet'} />
                                    )}
                                  </>
                                )}
                              </WebSocketHandler>
                            </GroupProvider>
                          </BgUrlProvider>
                        </VADProvider>
                      </SubtitleProvider>
                    </Live2DConfigProvider>
                  </ProactiveSpeakProvider>
                </AiStateProvider>
              </ChatHistoryProvider>
            </CharacterConfigProvider>
          </ScreenCaptureProvider>
        </CameraProvider>
      </Live2DModelProvider>
    </ChakraProvider>
  );
}
export default App;

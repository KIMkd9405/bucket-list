import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, Dimensions ,Button } from 'react-native';
import styled, { ThemeProvider } from 'styled-components/native';
import { theme } from './theme';
import Input from './components/Input';
import Task from './components/Task';
import { Alert } from 'react-native';

//로컬에 데이터 관리
import AsyncStorage from '@react-native-async-storage/async-storage';

//앱실행시 로딩화면 제어 : 앱실행전 사전작업이 준비될때까지 로딩화면을 유지시키는 역할
import * as SplashScreen from 'expo-splash-screen';

//사전작업이 준비될때까지 로딩화면 유지
SplashScreen.preventAutoHideAsync();

const Container = styled.SafeAreaView.attrs(null)`
  flex: 1;
  background-color: ${({ theme }) => theme.background};
  align-items: center;
  justify-content: flex-start;
`;

const Title = styled.Text`
  font-size: 40px;
  font-weight: 600;
  background-color: ${({ theme }) => theme.itemBackground};
  color: ${({ theme }) => theme.text};
  align-self: stretch;
  text-align: center;
  margin: 0 20px;
`;

const deletebutton = styled.Text`
 font-size: 24px; /* 원하는 크기로 조정하세요 */
  font-weight: 600;
  text-align: center;
 `;''

const List = styled.ScrollView`
  flex: 1;
  width: ${({ width }) => width - 40}px;
`;

const App = () => {
  //앱 준비상태 여부를 판단하는 상태변수
  const [appIsReady, setAppIsReady] = useState(false);

  // 새로운 작업을 저장하는 상태변수
  const [newTask, setNewTask] = useState('');

  // 작업목록을 저장하는 상태변수
  const [tasks, setTasks] = useState({});

  //로컬파일에 저장
  const saveTasks = async tasks => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks)); // js obj => json포맷의 문자열로 저장
      setTasks(tasks);
    } catch (error) {
      console.log(error.message);
    }
  };

  //로컬파일에서 읽어오기
  const loadTask = async () => {
    try {
      const loadedTasks = await AsyncStorage.getItem('tasks');
      setTasks(JSON.parse(loadedTasks || '{}')); // json포맷의 문자자열 => js obj
    } catch (error) {
      console.log(error.message);
    }
  };

  // 앱 실행전 1회 호출
  useEffect(() => {
    async function prepare() {
      try {
        // 앱 실행전 자원 준비 : 로컬파일의 항목리스트를 읽어와서 task상태 변수에 저장
        await loadTask();
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // 앱이 마운트될때 또는 컨테이너 레이아웃이 재계산될때마다 수행
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // 앱실행 준비가 되었을때 로딩 화면을 숨김.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // 앱이 준비상태가 되었을때만 이하로직 수행
  if (!appIsReady) return null;

  // 입력 항목이 수정될때마다 newTask변수에 수정된 내용을 저장
  const h_onChangeText = text => setNewTask(text);

  // 할일 항목 추가
  const h_onSubmitEditing = () => {
    // alert(newTask);
    const key = Date.now().toString(); //중복되지 않는 유일한 임의값
    const newTaskObject = {
      [key]: { id: key, text: newTask, completed: false },
    };
    setNewTask(''); //입력항목 클리어
    //setTasks({ ...tasks, ...newTaskObject }); //기존 tasks에 새로 입력된 항목 추가
    saveTasks({ ...tasks, ...newTaskObject });
  };

  const { width } = Dimensions.get('window');

// Task 컴포넌트에서 항목 삭제 함수
  const h_deleteTask = id => {
  const confirmDelete = () => {
    Alert.alert(
      '삭제 확인',
      '정말로 이 작업을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          onPress: () => handleDelete(id), // 확인 버튼을 누르면 삭제 함수 호출
        },
      ],
      { cancelable: true }
    );
  };

  confirmDelete();
};

  // 할일 항목 삭제
  const handleDelete  = id => {
    const currentTasks = { ...tasks };
    delete currentTasks[id];
    saveTasks(currentTasks);
  };

  // 할일 항목 완료/미완료
  const h_toggleTask = id => {
    const currentTasks = { ...tasks };
    currentTasks[id]['completed'] = !currentTasks[id]['completed'];
    
    saveTasks(currentTasks);
  };

  // 할일 항목 수정
  const h_updateTask = task => {
    const currentTasks = { ...tasks };
    currentTasks[task.id] = task;
    saveTasks(currentTasks);
  };

  // 할일 항목 등록취소
  const h_onBlur = () => {
    setNewTask('');
  };

// 완료된 항목 전체 삭제 함수
  const h_deleteCompletedTasks = () => {
    const confirmDelete = () => {
      Alert.alert(
        '전체 삭제 확인',
        '완료된 항목을 모두 삭제하시겠습니까?',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '삭제',
            onPress: () => handleDeleteCompletedTasks(),
          },
        ],
        { cancelable: true }
      );
    };

    confirmDelete();
  };

  // 완료된 항목 삭제 로직
  const handleDeleteCompletedTasks = () => {
    const currentTasks = { ...tasks };
    for (const taskId in currentTasks) {
      if (currentTasks[taskId].completed) {
        delete currentTasks[taskId];
      }
    }
    saveTasks(currentTasks);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container onLayout={onLayoutRootView}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.background}
        />
        <Title> 버킷  리스트 </Title>
        <Input
          placeholder="+항목추가 "
          value={newTask}
          onChangeText={h_onChangeText}
          onSubmitEditing={h_onSubmitEditing} //추가
          onBlur={h_onBlur} // 항목추가 입력필드가 포커스 벗어나면 호출
        />
        <List width={width}>
          {Object.values(tasks)
            .reverse()
            .map(task => (
              <Task
                key={task.id}
                task={task}
                deleteTask={h_deleteTask} //삭제
                toggleTask={h_toggleTask} //완료/미완료
                updateTask={h_updateTask} //수정
              />
            ))}
        </List>
        {/* 완료된 항목 삭제 버튼 */}
        <Button
          title="완료된 항목 삭제"
          onPress={h_deleteCompletedTasks}
          color={theme.button}    
        />
      </Container>
    </ThemeProvider>
  );
};

export default App;
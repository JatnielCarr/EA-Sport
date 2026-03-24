import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    FlatList,
    Modal,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, gradients, shadows } from '../../theme/colors';
import { Loading, EmptyState, Badge, Button, Card, Header } from '../../components/common';

const { width } = Dimensions.get('window');

const TABS = [
    { key: 'info', label: 'Info', icon: 'information-circle-outline' },
    { key: 'members', label: 'Miembros', icon: 'people-outline' },
    { key: 'chat', label: 'Chat', icon: 'chatbubbles-outline' },
    { key: 'manage', label: 'Gestión', icon: 'settings-outline' },
];

export default function ClanDetailScreen({ route, navigation }) {
    const { id: clanId } = route.params;
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clan, setClan] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [membership, setMembership] = useState(null); // null | { role: 'LEADER'|'OFFICER'|'MEMBER' }

    // Chat state
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const chatScrollRef = useRef(null);
    const chatPollRef = useRef(null);

    // Requests state
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

    // Join request state
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [joinTitle, setJoinTitle] = useState('');
    const [joinMessage, setJoinMessage] = useState('');
    const [joiningClan, setJoiningClan] = useState(false);

    // Role change modal
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    const isLeader = membership?.role === 'LEADER';
    const isOfficer = membership?.role === 'OFFICER';
    const isMember = !!membership;
    const canManage = isLeader || isOfficer;

    const fetchClan = useCallback(async () => {
        try {
            const response = await api.get(`/clans/${clanId}`);
            const clanData = response?.data || response;
            setClan(clanData);

            // Check membership
            if (userInfo && clanData?.members) {
                const myMembership = clanData.members.find(m =>
                    m.user_id === userInfo.id || m.user?.id === userInfo.id
                );
                setMembership(myMembership || null);
            }
        } catch (error) {
            console.warn('Error fetching clan:', error);
            Alert.alert('Error', 'No se pudo cargar el clan');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [clanId, userInfo]);

    const fetchMessages = useCallback(async () => {
        if (!isMember) return;
        try {
            const response = await api.get(`/clans/${clanId}/messages?limit=50`);
            const msgs = response?.data || response || [];
            setMessages(Array.isArray(msgs) ? msgs : []);
        } catch (error) {
            console.warn('Error fetching messages:', error);
        }
    }, [clanId, isMember]);

    const fetchRequests = useCallback(async () => {
        if (!canManage) return;
        setLoadingRequests(true);
        try {
            const response = await api.get(`/clans/${clanId}/requests`);
            const reqs = response?.data || response || [];
            setRequests(Array.isArray(reqs) ? reqs : []);
        } catch (error) {
            console.warn('Error fetching requests:', error);
        } finally {
            setLoadingRequests(false);
        }
    }, [clanId, canManage]);

    useEffect(() => {
        fetchClan();
    }, [fetchClan]);

    useEffect(() => {
        if (isMember) {
            fetchMessages();
            // Poll chat every 5 seconds
            chatPollRef.current = setInterval(fetchMessages, 5000);
        }
        return () => {
            if (chatPollRef.current) clearInterval(chatPollRef.current);
        };
    }, [isMember, fetchMessages]);

    useEffect(() => {
        if (canManage && activeTab === 'manage') {
            fetchRequests();
        }
    }, [canManage, activeTab, fetchRequests]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchClan();
        if (isMember) fetchMessages();
        if (canManage) fetchRequests();
    }, [fetchClan, fetchMessages, fetchRequests, isMember, canManage]);

    // ===================== ACTIONS =====================

    const handleJoinOpen = async () => {
        try {
            setJoiningClan(true);
            await api.post(`/clans/${clanId}/join`);
            Alert.alert('¡Bienvenido!', 'Te has unido al clan exitosamente.');
            fetchClan();
        } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo unir al clan');
        } finally {
            setJoiningClan(false);
        }
    };

    const handleJoinRequest = async () => {
        if (!joinTitle.trim() || !joinMessage.trim()) {
            Alert.alert('Error', 'Completa todos los campos de la solicitud');
            return;
        }
        try {
            setJoiningClan(true);
            await api.post(`/clans/${clanId}/request`, {
                title: joinTitle.trim(),
                message: joinMessage.trim(),
            });
            Alert.alert('Solicitud Enviada', 'Tu solicitud ha sido enviada al líder del clan.');
            setJoinModalVisible(false);
            setJoinTitle('');
            setJoinMessage('');
        } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo enviar la solicitud');
        } finally {
            setJoiningClan(false);
        }
    };

    const handleLeaveClan = () => {
        Alert.alert(
            'Abandonar Clan',
            '¿Estás seguro de que quieres abandonar este clan?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Abandonar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/clans/${clanId}/members/${userInfo.id}`);
                            Alert.alert('Clan Abandonado', 'Has abandonado el clan.');
                            setMembership(null);
                            fetchClan();
                        } catch (error) {
                            Alert.alert('Error', error?.message || 'No se pudo abandonar el clan');
                        }
                    },
                },
            ]
        );
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        setSendingMessage(true);
        try {
            await api.post(`/clans/${clanId}/messages`, {
                content: chatInput.trim(),
                is_announcement: isAnnouncement,
            });
            setChatInput('');
            setIsAnnouncement(false);
            fetchMessages();
        } catch (error) {
            Alert.alert('Error', 'No se pudo enviar el mensaje');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleRequestAction = async (requestId, action) => {
        try {
            await api.post(`/clans/${clanId}/requests/${requestId}/${action}`);
            Alert.alert(
                action === 'approve' ? 'Aprobado' : 'Rechazado',
                `Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente.`
            );
            fetchRequests();
            fetchClan();
        } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo procesar la solicitud');
        }
    };

    const handleRemoveMember = (member) => {
        const username = member.user?.username || member.username || 'este miembro';
        Alert.alert(
            'Eliminar Miembro',
            `¿Estás seguro de eliminar a ${username} del clan?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/clans/${clanId}/members/${member.user_id}`);
                            Alert.alert('Eliminado', `${username} ha sido eliminado del clan.`);
                            fetchClan();
                        } catch (error) {
                            Alert.alert('Error', error?.message || 'No se pudo eliminar al miembro');
                        }
                    },
                },
            ]
        );
    };

    const handleChangeRole = async (newRole) => {
        if (!selectedMember) return;
        try {
            await api.put(`/clans/${clanId}/members/${selectedMember.user_id}/role`, {
                role: newRole,
            });
            Alert.alert('Rol Actualizado', `El rol ha sido cambiado a ${newRole}.`);
            setRoleModalVisible(false);
            setSelectedMember(null);
            fetchClan();
        } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo cambiar el rol');
        }
    };

    // ===================== RENDER HELPERS =====================

    const getAccessIcon = (type) => {
        switch (type) {
            case 'OPEN': return 'lock-open-outline';
            case 'INVITE_ONLY': return 'mail-outline';
            case 'CLOSED': return 'lock-closed-outline';
            default: return 'shield-outline';
        }
    };

    const getAccessLabel = (type) => {
        switch (type) {
            case 'OPEN': return 'Abierto';
            case 'INVITE_ONLY': return 'Invitación';
            case 'CLOSED': return 'Cerrado';
            default: return type;
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'LEADER': return 'crown-outline';
            case 'OFFICER': return 'star-outline';
            default: return 'person-outline';
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'LEADER': return colors.gold;
            case 'OFFICER': return colors.primary;
            default: return colors.textSecondary;
        }
    };

    // ===================== TAB: INFO =====================
    const renderInfo = () => (
        <View style={styles.tabContent}>
            <Card title="Acerca del Clan" icon="information-circle-outline">
                <Text style={styles.description}>{clan.description || 'Sin descripción.'}</Text>
            </Card>

            <Card title="Detalles" icon="list-outline">
                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="people" size={18} color={colors.primary} />
                        <Text style={styles.detailLabel}>Miembros</Text>
                        <Text style={styles.detailValue}>
                            {clan.members?.length || clan.member_count || 0}/{clan.max_members || 50}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name={getAccessIcon(clan.access_type)} size={18} color={colors.primary} />
                        <Text style={styles.detailLabel}>Acceso</Text>
                        <Text style={styles.detailValue}>{getAccessLabel(clan.access_type)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={18} color={colors.primary} />
                        <Text style={styles.detailLabel}>Ubicación</Text>
                        <Text style={styles.detailValue}>{clan.location || 'Global'}</Text>
                    </View>
                </View>
            </Card>

            {clan.requirements && (
                <Card title="Requisitos" icon="clipboard-outline">
                    <Text style={styles.requirements}>{clan.requirements}</Text>
                </Card>
            )}

            <Card title="Líder" icon="crown-outline">
                <View style={styles.leaderRow}>
                    <LinearGradient colors={gradients.primary} style={styles.leaderAvatar}>
                        <Ionicons name="person" size={24} color={colors.white} />
                    </LinearGradient>
                    <View style={styles.leaderInfo}>
                        <Text style={styles.leaderName}>
                            {clan.leader?.username || 'Desconocido'}
                        </Text>
                        <Text style={styles.leaderRole}>Fundador & Líder</Text>
                    </View>
                </View>
            </Card>

            <View style={styles.clanDate}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={styles.dateText}>
                    Creado el {new Date(clan.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </Text>
            </View>
        </View>
    );

    // ===================== TAB: MEMBERS =====================
    const renderMembers = () => {
        const members = clan.members || [];
        const sorted = [...members].sort((a, b) => {
            const roleOrder = { LEADER: 0, OFFICER: 1, MEMBER: 2 };
            return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
        });

        return (
            <View style={styles.tabContent}>
                <Text style={styles.memberCount}>
                    {sorted.length} miembro{sorted.length !== 1 ? 's' : ''}
                </Text>
                {sorted.map((member) => (
                    <TouchableOpacity
                        key={member.user_id || member.id}
                        style={styles.memberCard}
                        onLongPress={() => {
                            if (isLeader && member.role !== 'LEADER') {
                                setSelectedMember(member);
                                setRoleModalVisible(true);
                            }
                        }}
                    >
                        <LinearGradient
                            colors={member.role === 'LEADER' ? ['#ffd700', '#ffb800'] :
                                member.role === 'OFFICER' ? gradients.primary : ['#333', '#222']}
                            style={styles.memberAvatar}
                        >
                            <Ionicons name="person" size={20} color={colors.white} />
                        </LinearGradient>
                        <View style={styles.memberInfo}>
                            <Text style={styles.memberName}>
                                {member.user?.username || member.username || 'Jugador'}
                            </Text>
                            <View style={styles.memberRoleRow}>
                                <Ionicons
                                    name={member.role === 'LEADER' ? 'crown' : member.role === 'OFFICER' ? 'star' : 'person'}
                                    size={12}
                                    color={getRoleColor(member.role)}
                                />
                                <Text style={[styles.memberRole, { color: getRoleColor(member.role) }]}>
                                    {member.role === 'LEADER' ? 'Líder' : member.role === 'OFFICER' ? 'Oficial' : 'Miembro'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.memberActions}>
                            {isLeader && member.role !== 'LEADER' && (
                                <TouchableOpacity
                                    style={styles.memberActionBtn}
                                    onPress={() => handleRemoveMember(member)}
                                >
                                    <Ionicons name="close-circle" size={22} color={colors.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    // ===================== TAB: CHAT =====================
    const renderChat = () => {
        if (!isMember) {
            return (
                <EmptyState
                    icon="lock-closed-outline"
                    title="Chat Privado"
                    message="Solo los miembros del clan pueden ver el chat."
                />
            );
        }

        return (
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={120}
            >
                <ScrollView
                    ref={chatScrollRef}
                    style={styles.chatMessages}
                    contentContainerStyle={styles.chatMessagesContent}
                    onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyChatContainer}>
                            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyChatText}>
                                No hay mensajes aún. ¡Sé el primero!
                            </Text>
                        </View>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.user_id === userInfo?.id;
                            return (
                                <View
                                    key={msg.id || msg.created_at}
                                    style={[
                                        styles.messageContainer,
                                        msg.is_announcement && styles.announcementContainer,
                                        isMe && styles.myMessageContainer,
                                    ]}
                                >
                                    {msg.is_announcement && (
                                        <View style={styles.announcementBadge}>
                                            <Ionicons name="megaphone" size={12} color={colors.warning} />
                                            <Text style={styles.announcementLabel}>ANUNCIO</Text>
                                        </View>
                                    )}
                                    <View style={[
                                        styles.messageBubble,
                                        msg.is_announcement && styles.announcementBubble,
                                        isMe && styles.myBubble,
                                    ]}>
                                        {!isMe && (
                                            <Text style={[
                                                styles.messageAuthor,
                                                { color: getRoleColor(clan.members?.find(m => m.user_id === msg.user_id)?.role) }
                                            ]}>
                                                {msg.user?.username || 'Anónimo'}
                                            </Text>
                                        )}
                                        <Text style={styles.messageText}>{msg.content}</Text>
                                        <Text style={styles.messageTime}>
                                            {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* Chat Input */}
                <View style={styles.chatInputContainer}>
                    {(isLeader || isOfficer) && (
                        <TouchableOpacity
                            style={[styles.announcementToggle, isAnnouncement && styles.announcementToggleActive]}
                            onPress={() => setIsAnnouncement(!isAnnouncement)}
                        >
                            <Ionicons
                                name="megaphone"
                                size={18}
                                color={isAnnouncement ? colors.warning : colors.textMuted}
                            />
                        </TouchableOpacity>
                    )}
                    <TextInput
                        style={styles.chatInputField}
                        value={chatInput}
                        onChangeText={setChatInput}
                        placeholder={isAnnouncement ? 'Escribir anuncio...' : 'Escribe un mensaje...'}
                        placeholderTextColor={colors.textMuted}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !chatInput.trim() && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!chatInput.trim() || sendingMessage}
                    >
                        {sendingMessage ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <Ionicons name="send" size={20} color={colors.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    };

    // ===================== TAB: MANAGE =====================
    const renderManage = () => {
        if (!canManage) {
            return (
                <EmptyState
                    icon="lock-closed-outline"
                    title="Sin permisos"
                    message="Solo el líder y oficiales pueden gestionar el clan."
                />
            );
        }

        return (
            <View style={styles.tabContent}>
                {/* Pending Requests */}
                <Card title="Solicitudes Pendientes" icon="mail-unread-outline">
                    {loadingRequests ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : requests.length === 0 ? (
                        <Text style={styles.noRequests}>No hay solicitudes pendientes</Text>
                    ) : (
                        requests.map((req) => (
                            <View key={req.id} style={styles.requestCard}>
                                <View style={styles.requestHeader}>
                                    <LinearGradient colors={gradients.accent} style={styles.requestAvatar}>
                                        <Ionicons name="person" size={16} color={colors.white} />
                                    </LinearGradient>
                                    <View style={styles.requestInfo}>
                                        <Text style={styles.requestUser}>
                                            {req.user?.username || 'Jugador'}
                                        </Text>
                                        <Text style={styles.requestTitle}>{req.title}</Text>
                                    </View>
                                </View>
                                <Text style={styles.requestMessage}>{req.message}</Text>
                                <Text style={styles.requestDate}>
                                    {new Date(req.created_at).toLocaleDateString('es-ES')}
                                </Text>
                                <View style={styles.requestActions}>
                                    <TouchableOpacity
                                        style={[styles.requestBtn, styles.approveBtn]}
                                        onPress={() => handleRequestAction(req.id, 'approve')}
                                    >
                                        <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                                        <Text style={styles.requestBtnText}>Aceptar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.requestBtn, styles.rejectBtn]}
                                        onPress={() => handleRequestAction(req.id, 'reject')}
                                    >
                                        <Ionicons name="close-circle" size={18} color={colors.white} />
                                        <Text style={styles.requestBtnText}>Rechazar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </Card>

                {/* Clan Actions */}
                {isLeader && (
                    <Card title="Acciones del Clan" icon="construct-outline">
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('EditClan', { clanId: clan.id })}
                        >
                            <Ionicons name="create-outline" size={22} color={colors.primary} />
                            <Text style={styles.actionItemText}>Editar Clan</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionItem, styles.dangerAction]}
                            onPress={() => {
                                Alert.alert(
                                    'Eliminar Clan',
                                    '¿Estás seguro? Esta acción no se puede deshacer.',
                                    [
                                        { text: 'Cancelar', style: 'cancel' },
                                        {
                                            text: 'Eliminar',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    await api.delete(`/clans/${clanId}`);
                                                    Alert.alert('Clan Eliminado');
                                                    navigation.goBack();
                                                } catch (error) {
                                                    Alert.alert('Error', error?.message || 'No se pudo eliminar');
                                                }
                                            },
                                        },
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash-outline" size={22} color={colors.error} />
                            <Text style={[styles.actionItemText, { color: colors.error }]}>Eliminar Clan</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    </Card>
                )}
            </View>
        );
    };

    // ===================== MAIN RENDER =====================

    if (loading) return <Loading text="Cargando clan..." />;
    if (!clan) {
        return (
            <EmptyState
                icon="alert-circle-outline"
                title="Clan no encontrado"
                message="No se pudo cargar la información del clan."
                action={{ label: 'Volver', onPress: () => navigation.goBack() }}
            />
        );
    }

    const visibleTabs = TABS.filter(tab => {
        if (tab.key === 'chat' && !isMember) return false;
        if (tab.key === 'manage' && !canManage) return false;
        return true;
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Banner */}
            <View style={styles.banner}>
                {clan.banner_url ? (
                    <Image source={{ uri: clan.banner_url }} style={styles.bannerImage} />
                ) : (
                    <LinearGradient colors={gradients.primary} style={styles.bannerGradient} />
                )}
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bannerOverlay}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                    </TouchableOpacity>
                    <View style={styles.bannerInfo}>
                        <View style={styles.bannerHeader}>
                            <Text style={styles.clanName}>{clan.name}</Text>
                            <Badge
                                label={getAccessLabel(clan.access_type)}
                                variant={clan.access_type === 'OPEN' ? 'success' : clan.access_type === 'INVITE_ONLY' ? 'warning' : 'error'}
                            />
                        </View>
                        <Text style={styles.clanTag}>[{clan.tag}]</Text>
                    </View>
                </LinearGradient>
            </View>

            {/* Join / Leave Buttons */}
            {!isMember && clan.access_type === 'OPEN' && (
                <TouchableOpacity style={styles.joinBar} onPress={handleJoinOpen} disabled={joiningClan}>
                    <LinearGradient colors={gradients.success} style={styles.joinBarGradient}>
                        {joiningClan ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <>
                                <Ionicons name="enter-outline" size={20} color={colors.white} />
                                <Text style={styles.joinBarText}>Unirse al Clan</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {!isMember && clan.access_type === 'INVITE_ONLY' && (
                <TouchableOpacity style={styles.joinBar} onPress={() => setJoinModalVisible(true)}>
                    <LinearGradient colors={gradients.primary} style={styles.joinBarGradient}>
                        <Ionicons name="mail-outline" size={20} color={colors.white} />
                        <Text style={styles.joinBarText}>Solicitar Unirme</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {isMember && !isLeader && (
                <TouchableOpacity style={styles.leaveBar} onPress={handleLeaveClan}>
                    <Ionicons name="exit-outline" size={18} color={colors.error} />
                    <Text style={styles.leaveBarText}>Abandonar Clan</Text>
                </TouchableOpacity>
            )}

            {/* Tabs */}
            <View style={styles.tabBar}>
                {visibleTabs.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons
                            name={tab.icon}
                            size={18}
                            color={activeTab === tab.key ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {activeTab === 'info' && renderInfo()}
                {activeTab === 'members' && renderMembers()}
                {activeTab === 'chat' && renderChat()}
                {activeTab === 'manage' && renderManage()}
            </ScrollView>

            {/* Join Request Modal */}
            <Modal visible={joinModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Solicitar Unirme</Text>
                            <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>
                            Envía una solicitud al líder de {clan.name}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={joinTitle}
                            onChangeText={setJoinTitle}
                            placeholder="Título de la solicitud"
                            placeholderTextColor={colors.textMuted}
                            maxLength={100}
                        />
                        <TextInput
                            style={[styles.modalInput, styles.modalTextArea]}
                            value={joinMessage}
                            onChangeText={setJoinMessage}
                            placeholder="¿Por qué quieres unirte?"
                            placeholderTextColor={colors.textMuted}
                            multiline
                            maxLength={500}
                            numberOfLines={4}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setJoinModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSubmitBtn}
                                onPress={handleJoinRequest}
                                disabled={joiningClan}
                            >
                                <LinearGradient colors={gradients.primary} style={styles.modalSubmitGradient}>
                                    {joiningClan ? (
                                        <ActivityIndicator color={colors.white} size="small" />
                                    ) : (
                                        <Text style={styles.modalSubmitText}>Enviar</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Role Change Modal */}
            <Modal visible={roleModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Cambiar Rol</Text>
                        <Text style={styles.modalSubtitle}>
                            {selectedMember?.user?.username || 'Miembro'}
                        </Text>
                        <TouchableOpacity
                            style={styles.roleOption}
                            onPress={() => handleChangeRole('OFFICER')}
                        >
                            <Ionicons name="star" size={22} color={colors.primary} />
                            <View style={styles.roleOptionInfo}>
                                <Text style={styles.roleOptionLabel}>Oficial</Text>
                                <Text style={styles.roleOptionDesc}>Puede gestionar solicitudes y moderar el chat</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.roleOption}
                            onPress={() => handleChangeRole('MEMBER')}
                        >
                            <Ionicons name="person" size={22} color={colors.textSecondary} />
                            <View style={styles.roleOptionInfo}>
                                <Text style={styles.roleOptionLabel}>Miembro</Text>
                                <Text style={styles.roleOptionDesc}>Miembro regular del clan</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalCancelBtn}
                            onPress={() => { setRoleModalVisible(false); setSelectedMember(null); }}
                        >
                            <Text style={styles.modalCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    // Banner
    banner: { height: 200, position: 'relative' },
    bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    bannerGradient: { width: '100%', height: '100%' },
    bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'space-between', padding: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    bannerInfo: { marginBottom: 8 },
    bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    clanName: { fontSize: 24, fontWeight: 'bold', color: colors.white },
    clanTag: { fontSize: 16, color: colors.primary, fontWeight: '600', marginTop: 2 },
    // Join/Leave bars
    joinBar: { marginHorizontal: 16, marginTop: 12, borderRadius: 12, overflow: 'hidden' },
    joinBarGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
    joinBarText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
    leaveBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginHorizontal: 16, marginTop: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.error + '40' },
    leaveBarText: { color: colors.error, fontSize: 14, fontWeight: '600' },
    // Tabs
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 12 },
    tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
    tabItemActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    tabLabelActive: { color: colors.primary },
    scrollView: { flex: 1 },
    tabContent: { padding: 16 },
    // Info tab
    description: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-around' },
    detailItem: { alignItems: 'center', gap: 4 },
    detailLabel: { color: colors.textMuted, fontSize: 12 },
    detailValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
    requirements: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
    leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    leaderAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    leaderInfo: { flex: 1 },
    leaderName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
    leaderRole: { color: colors.gold, fontSize: 13 },
    clanDate: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 16, marginBottom: 32 },
    dateText: { color: colors.textMuted, fontSize: 12 },
    // Members tab
    memberCount: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
    memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    memberInfo: { flex: 1, marginLeft: 12 },
    memberName: { color: colors.text, fontSize: 15, fontWeight: '600' },
    memberRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    memberRole: { fontSize: 12 },
    memberActions: { flexDirection: 'row', gap: 8 },
    memberActionBtn: { padding: 4 },
    // Chat
    chatContainer: { flex: 1, minHeight: 400 },
    chatMessages: { flex: 1, paddingHorizontal: 16 },
    chatMessagesContent: { paddingVertical: 12 },
    emptyChatContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyChatText: { color: colors.textMuted, marginTop: 12, fontSize: 14 },
    messageContainer: { marginBottom: 8 },
    myMessageContainer: { alignItems: 'flex-end' },
    announcementContainer: { marginVertical: 8 },
    messageBubble: { maxWidth: '80%', backgroundColor: colors.card, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: colors.border },
    myBubble: { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' },
    announcementBubble: { maxWidth: '100%', backgroundColor: colors.warning + '15', borderColor: colors.warning + '30', borderRadius: 12 },
    announcementBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, paddingHorizontal: 16 },
    announcementLabel: { color: colors.warning, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    messageAuthor: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
    messageText: { color: colors.text, fontSize: 14, lineHeight: 20 },
    messageTime: { color: colors.textMuted, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    // Chat Input
    chatInputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
    announcementToggle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
    announcementToggleActive: { backgroundColor: colors.warning + '20' },
    chatInputField: { flex: 1, backgroundColor: colors.card, borderRadius: 20, padding: 10, paddingHorizontal: 16, color: colors.text, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    sendButtonDisabled: { backgroundColor: colors.textMuted },
    // Manage tab
    noRequests: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
    requestCard: { backgroundColor: colors.backgroundLight, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    requestAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    requestInfo: { flex: 1 },
    requestUser: { color: colors.text, fontWeight: 'bold', fontSize: 14 },
    requestTitle: { color: colors.textSecondary, fontSize: 12 },
    requestMessage: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 6 },
    requestDate: { color: colors.textMuted, fontSize: 11, marginBottom: 8 },
    requestActions: { flexDirection: 'row', gap: 8 },
    requestBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10 },
    approveBtn: { backgroundColor: colors.success },
    rejectBtn: { backgroundColor: colors.error },
    requestBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
    // Actions
    actionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    actionItemText: { flex: 1, color: colors.text, fontSize: 15 },
    dangerAction: { borderBottomWidth: 0 },
    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
    modalSubtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: 16 },
    modalInput: { backgroundColor: colors.backgroundLight, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    modalTextArea: { minHeight: 100, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    modalCancelText: { color: colors.textSecondary, fontWeight: '600' },
    modalSubmitBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    modalSubmitGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    modalSubmitText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
    // Role modal
    roleOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    roleOptionInfo: { flex: 1 },
    roleOptionLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
    roleOptionDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});

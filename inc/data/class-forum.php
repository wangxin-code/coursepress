<?php
class CoursePress_Data_Forum {

	private $post_type = 'discussions';

	public function __construct() {
		add_action( 'pre_get_posts', array( $this, 'maybe_add_topic' ) );
		add_action( 'wp_insert_comment', array( $this, 'insert_comment' ), 10, 2 );
		add_filter( 'comment_post_redirect', array( $this, 'redirect_back' ), 10, 2 );
		add_action( 'comment_form', array( $this, 'add_topic_field' ) );
	}

	public function maybe_add_topic( $wp ) {
		if ( ! $wp->is_main_query() ) {
			return;
		}
		if (
			! isset( $_POST['_wpnonce'] )
			|| ! isset( $_POST['course_id'] )
			|| ! isset( $_POST['unit_id'] )
			|| ! isset( $_POST['action'] )
			|| ! isset( $_POST['title'] )
			|| ! isset( $_POST['content'] )
			|| 'add_new_discussion' != $_POST['action']
			|| ! wp_verify_nonce( $_POST['_wpnonce'], 'add-new-discussion' )
		) {
			return;
		}
		$args = array(
			'post_type' => $this->post_type,
			'post_parent' => $_POST['course_id'],
			'post_author' => get_current_user_id(),
			'post_content' => CoursePress_Utility::filter_content( $_POST['content'] ),
			'post_status' => 'publish',
			'post_title' => CoursePress_Utility::filter_content( $_POST['title'] ),
			'meta_input' => array(
				'unit_id' => $_POST['unit_id'],
			),
		);
		if ( isset( $_POST['id'] ) && ! empty( $_POST['id'] ) ) {
			$args['ID'] = $_POST['id'];
		} else {
			/**
			 * Check is post like this already added?
			 */
			$q = new WP_Query( $args );
			if ( $q->have_posts() ) {
				return new WP_Error( 'forum_duplicate', __( 'Duplicate forum detected; it looks as though you&#8217;ve already said that!', 'cp' ) );
			}
		}
		wp_insert_post( $args );
	}

	public function insert_comment( $id, $comment ) {
		$is_discussion = coursepress_is_type( $comment->comment_post_ID, 'discussion' );
		if ( ! $is_discussion ) {
			return;
		}
		wp_set_comment_status( $id, 'approve' );
		$metas = array( 'topic_id', 'course_id' );
		foreach ( $metas as $meta ) {
			if ( isset( $_REQUEST[ $meta ] ) ) {
				$value = intval( $_REQUEST[ $meta ] );
				if ( $value ) {
					add_comment_meta( $id, $meta, $value, true );
				}
			}
		}
	}

	/**
	 * Redirect back to discussion or discussion module page.
	 *
	 * @since 2.0
	 **/
	public function redirect_back( $location, $comment ) {
		/**
		 * Check WP_Comment class
		 */
		if ( ! is_a( $comment, 'WP_Comment' ) ) {
			return $location;
		}
		$course_id = get_post_field( 'post_parent', $comment->comment_post_ID );
		$course = coursepress_get_course( $course_id );
		$post_type = get_post_type( $comment->comment_post_ID );
		if ( $this->post_type === $post_type ) {
			$post_name = get_post_field( 'post_name', $comment->comment_post_ID );
			$location = $course->get_discussion_url(). trailingslashit( $post_name ) . '#comment-' . $comment->comment_ID;
		}
		return $location;
	}

	public function add_topic_field( $post_id ) {
		$discussion = coursepress_get_discussion();
		if ( ! empty( $discussion ) ) {
			printf(
				'<input type="hidden" name="topic_id" value="%d" />',
				esc_attr( $discussion->ID )
			);
		}
	}
}
